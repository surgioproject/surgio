# v4 升级指南

Surgio v4 将配置仓库统一为原生 TypeScript ESM Project，并让本地 CLI、Node
Gateway 和 Cloudflare Worker 可以共用同一份配置。由于配置入口、Provider 加载、
缓存和 Gateway 都有变化，建议把升级当作一次有基线、有验证的迁移，而不是只修改
`package.json` 中的版本号。

**目录**

[[toc]]

## 升级前准备

Surgio v4 要求 Node.js `>=22.22.2`。Project 直接由 Node.js 运行可擦除的
TypeScript 语法，不需要 Bun、`tsx`、`ts-node` 或其它运行时编译器。

开始前先确认工作区干净，并保存 v3 的生成结果：

```bash
git status --short
pnpm gen
find dist -type f -exec shasum -a 256 {} + | LC_ALL=C sort \
  > /tmp/surgio-v3.sha256
```

如果仓库提供 Gateway、Lambda 或其它服务端入口，还应保存至少一个代表性请求的
状态码、响应 headers 和 body。迁移完成并验证一致之前，不要删除旧配置，也不要
直接提交批量生成的差异。

## 使用迁移 Skill（推荐）

仓库提供了 [`migrate-v3-config`](https://github.com/geekdada/surgio/tree/master/skills/migrate-v3-config)
Skill，可以让 coding agent 盘点现有配置和部署方式、保存基线、执行 TypeScript
迁移并验证结果。使用 [Vercel 的 open agent skills CLI](https://github.com/vercel-labs/skills)
安装，不依赖某个 agent 自带的 Skill 安装功能；该工具支持 Claude Code、Codex、
Cursor、OpenCode 等多种 coding agent。

### 1. 安装 Skill

在 Surgio 配置仓库根目录运行：

```bash
npx skills add https://github.com/geekdada/surgio/tree/master/skills/migrate-v3-config
```

CLI 会检测本机安装的 coding agent，并在需要时让你选择目标。默认执行项目级安装，
适合随配置仓库共享；若希望在所有仓库中使用，可以增加 `--global`：

```bash
npx skills add https://github.com/geekdada/surgio/tree/master/skills/migrate-v3-config --global
```

如果安装后没有出现在 agent 的 Skill 列表中，请重新启动该 agent。

### 2. 在配置仓库中运行

在所选 coding agent 中打开 Surgio 配置仓库，并从仓库根目录开始一个新任务。不同
agent 的显式 Skill 语法可能不同，因此下面使用通用的自然语言调用。显式告诉 Skill
是否保留当前部署方式；如果没有说明，它会先盘点 Node、Lambda、容器、Wrangler
等入口，再询问你要选择哪条路径。

只保留现有非 Worker 部署：

```text
请使用 migrate-v3-config skill 将当前仓库升级到 Surgio v4，沿用现有非 Worker 部署方式。
先保存 Artifact 和服务响应基线，迁移后验证行为一致。
```

只保留现有 Cloudflare Worker 部署：

```text
请使用 migrate-v3-config skill 将当前仓库升级到 Surgio v4，沿用现有 Cloudflare Worker
部署、bindings、Assets、路由和域名，并验证 workerd 与 Wrangler dry-run。
```

同时支持本地/Node 与 Worker：

```text
请使用 migrate-v3-config skill 将当前仓库升级到 Surgio v4，保留 Node Gateway 和
Cloudflare Worker 两种部署，让它们共用同一个 surgio.project.ts，并比较两端
代表性 Artifact 的输出。
```

Skill 不会因为 Surgio 支持 Worker 就擅自增加 Worker 部署，也不会强迫你把已有的
字面量凭据改成环境变量。只有明确要求切换部署方式时，它才会删除旧 adapter 和部署
脚本。完成后应审阅它报告的命令、测试数量、Artifact 哈希和真实运行时验证结果，
不要只接受“TypeScript 编译通过”。

## 手动迁移

不使用 Skill 时，可以按以下顺序完成同样的迁移。

### 1. 升级依赖和运行时

将 Node.js 升级到 `22.22.2` 或更高版本，并在配置仓库中启用 ESM：

```json
{
  "type": "module",
  "engines": {
    "node": ">=22.22.2"
  }
}
```

升级 Surgio。使用 Gateway 的项目还需要安装与 Surgio v4 兼容的最新版 Gateway：

```bash
pnpm add surgio@^4
pnpm add @surgio/gateway@latest
pnpm add -D typescript @types/node
```

不使用 Gateway 时省略第二条命令。不要在配置仓库中依赖 Surgio 间接安装的
TypeScript；应把编译器列为直接开发依赖。

### 2. 建立唯一的 Project

把 `surgio.conf.js`、`provider/` 中的 Provider 和 Artifact 注册合并到唯一的
`surgio.project.ts`。Surgio 也能识别 `.mts`、`.mjs` 和 `.js`，但同一目录中只能
存在一个 Project 入口。

可以先让共享配置单独通过类型检查：

```ts
// config.ts
import type { SurgioProjectConfig } from 'surgio/project'

const config = {
  artifacts: [
    {
      name: 'surge.conf',
      provider: 'demo',
      template: 'surge',
    },
  ],
  urlBase: 'https://example.com/',
} satisfies SurgioProjectConfig

export default config
```

然后建立 Project：

```ts
// surgio.project.ts
import {
  defineClashProvider,
  defineSurgioProject,
  env,
  type SurgioNodeOptions,
} from 'surgio/project'

import config from './config.ts'

export default defineSurgioProject({
  ...config,
  providers: {
    demo: () =>
      defineClashProvider({
        url: env('DEMO_SUBSCRIPTION_URL'),
      }),
  },
  templateDir: './template',
})

export const nodeOptions = async (): Promise<SurgioNodeOptions> => ({
  output: './dist',
  cache: { type: 'filesystem' },
})
```

Surgio 配置字段直接位于 Project 顶层。`providers` 和 `templateDir` 是 Project
元数据，不要写成 `{ config, providers }`。`templateDir` 可以省略，默认使用
`./template`。

`output`、filesystem/Upstash cache 和 upload 只属于 Node 侧，必须放在具名导出的
`nodeOptions()` 中。Worker manifest 只读取默认导出，不会导入或序列化
`nodeOptions()`。

`env(name)` 从 `process.env` 读取必需的字符串，缺失时立即抛错。它只是语法糖；
已有的凭据管理方式可以继续使用，不需要把所有字面量强制改成 `env()`。

### 3. 显式注册 Provider

为了兼容 Worker 的部署形式，新版 Surgio 将不再扫描 `provider/`，因此所有 Provider 都应显式注册到 Project 的 `providers`
对象。静态配置可以直接注册；需要运行时依赖时使用 Provider factory：

```ts
import {
  defineClashProvider,
  defineSurgioProject,
  type ProjectProviderContext,
} from 'surgio/project'

const createDynamicProvider = async ({
  cache,
  httpClient,
  logger,
}: ProjectProviderContext) => {
  const url = await cache.wrap<string>(
    'demo:subscription-url',
    async () => {
      const response = await httpClient.get('https://example.com/subscription')
      return new URL(response.body.trim()).toString()
    },
    5 * 60 * 1000,
  )

  logger.debug('loaded dynamic subscription URL')
  return defineClashProvider({ url })
}

export default defineSurgioProject({
  artifacts: [],
  providers: { dynamic: createDynamicProvider },
})
```

Provider factory 获得的 cache、HTTP 和 logger 会分别由 Node 或 Worker runtime
提供；不要访问 Node 全局缓存或自行创建另一套客户端。若读取外部 JSON，应为响应
定义最小 interface 并校验未知数据，不要用 `any` 或双重断言绕过类型检查。

确认新 Project 能正常加载后，再删除 `surgio.conf.js` 和旧 Provider 扫描所需的
文件。新旧入口同时存在时 Surgio 会明确报错。

### 4. 配置严格 TypeScript

推荐使用严格且不输出文件的配置：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "rewriteRelativeImportExtensions": true,
    "types": ["node"]
  },
  "include": ["*.ts", "lib/**/*.ts", "provider/**/*.ts", "scripts/**/*.ts"],
  "exclude": [".surgio", "dist", "node_modules"]
}
```

本地相对 import 使用 `.ts` 扩展名；包 import 使用 `surgio/project`、
`surgio/runtime` 等公开子路径。只使用 Node 能直接擦除的 TypeScript 语法，例如
type、interface、`satisfies`、`as const` 和 type-only import；不要声明需要额外代码
生成的 enum、namespace 或 parameter property。

## 按部署方式迁移

### 本地 CLI

CLI 会优先加载 `surgio.project.ts`，并使用 `nodeOptions()` 中的 output、cache 和
upload。原有生成命令通常可以保持不变：

```json
{
  "scripts": {
    "gen": "SURGIO_GFW_FREE=1 surgio generate --cache-snippet",
    "typecheck": "tsc --noEmit",
    "check": "pnpm typecheck && eslint ."
  }
}
```

旧的 `surgio.conf.js + provider/` 仍可作为 Node-only 兼容入口临时运行，但不能与
Project 共存，也不能用于 Worker manifest。建议在一次升级中完成 Project 迁移，
避免继续维护两种加载模型。

### Node Gateway

Node Gateway 使用相同的 Project，不再自行读取 Artifact、Provider 目录或模板
engine。入口改为 Hono Node adapter：

```ts
// server.ts
import { startServer } from '@surgio/gateway/node'

await startServer()
```

默认从当前目录加载 `surgio.project.ts`。如需指定监听地址、端口或 assets，可以把
选项传给 `startServer()`；不要重新实现 Gateway 路由。

### AWS Lambda

Lambda 使用同一套 Node Project 和 Gateway app，只替换平台 adapter：

```ts
import { createLambdaHandler } from '@surgio/gateway/lambda'

export const handler = createLambdaHandler()
```

### Cloudflare Worker

Worker 在构建期读取同一个 `surgio.project.ts`，预编译模板并生成 manifest。使用
Gateway 时，构建脚本同时准备前端 assets：

```ts
// scripts/build-worker.ts
import { buildGatewayWorker } from '@surgio/gateway/worker/build'

await buildGatewayWorker()
```

Worker 入口只装配平台 binding：

```ts
// worker.ts
import { createWorkerGateway } from '@surgio/gateway/worker'
import { createCloudflareKvStore } from 'surgio/cache/cloudflare'
import { TtlCache } from 'surgio/cache/core'

import manifest from './.surgio/worker-manifest.mjs'

export default createWorkerGateway<Env>(manifest, {
  bindings(env) {
    return {
      cache: new TtlCache({
        store: createCloudflareKvStore(env.SURGIO_CACHE),
      }),
      assets: env.ASSETS,
    }
  },
})
```

使用 `wrangler types` 生成并提交 `worker-configuration.d.ts`，不要手写宽泛的 `Env`。
Wrangler 必须启用 `nodejs_compat`，并使用不早于 `2025-04-01` 的 compatibility
date，使文本变量和 Secrets 自动暴露给 `process.env`。KV 和 Assets 是结构化
binding，仍由 Worker adapter 显式注入。

Worker Provider、远程 snippet 和 Artifact 缓存必须共用上例中的 `TtlCache`。
Worker 代码只从 `surgio/cache/core` 和 `surgio/cache/cloudflare` 导入所需能力，
不要加载 Node cache 聚合入口、filesystem、Upstash、CLI 或运行时模板编译器。

完整的 manifest、Wrangler 和模板限制参见 [Cloudflare Worker 指南](/guide/worker.md)。

### Node 与 Worker 并存

双运行时项目仍然只保留一个 `surgio.project.ts`：

- 共享配置、Artifact、Provider registry 和 `templateDir` 位于默认导出；
- Node-only output、cache 和 upload 位于 `nodeOptions()`；
- Node Gateway 使用 `@surgio/gateway/node`；
- Worker 使用 manifest、Cloudflare KV 和 Assets binding。

平台差异只能出现在 adapter、cache 和 binding 层。不要创建
`surgio.worker.ts`、`worker.config.ts` 或另一份 Artifact/Provider 配置。

## 需要主动处理的破坏性变化

### Project 与模块格式

- Surgio 包和 v4 Project 使用 ESM。
- `defineSurgioConfig` 和 `defineWorkerProject` 已删除；统一使用
  `defineSurgioProject`。
- Project 必须显式注册 Provider。目录扫描只属于 legacy Node 入口。

### 缓存

Redis TCP、ioredis、`cache.type: 'redis'` 和 `redisUrl` 已删除：

- Node 默认使用 filesystem；`default` 仅作为 filesystem 的旧名称接受。
- Serverless Node 环境可以使用 Upstash REST，配置
  `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`。
- Cloudflare Worker 使用显式注入的 KV binding。

缓存数据属于可丢弃数据，v3 的 Redis 或临时文件记录不会迁移。升级后的首次运行出现
cold miss 属于正常行为。详细配置参见
[Upstash REST 缓存](/guide/advance/upstash-cache.md) 和
[缓存配置](/guide/custom-config.md#cache)。

### HTTP 客户端

`httpClient` 不再是 Got 实例，而是 Node 和 Worker 共用的 ky/Fetch 封装：

```ts
const response = await httpClient.get(url, { headers })

response.body       // string
response.headers    // Record<string, string | string[] | undefined>
response.statusCode // number
```

删除 Got 专用的 agent、timeout、retry 和 response API 用法。Provider factory 应优先
使用 runtime 注入的 `httpClient`。

### Clash 默认核心

`clashConfig.clashCore` 的默认值由旧 Clash 改为 Mihomo（内部值为
`'clash.meta'`）。如果需要维持旧 Clash 的字段和过滤行为，请显式设置：

```ts
clashConfig: {
  clashCore: 'clash',
}
```

`'mihomo'` 也可以作为输入别名，加载后会归一化为 `'clash.meta'`。

### 已删除的 Provider 和 Surge SSR 输出

- BlackSSL Provider 已完全删除；使用该类型会得到“不支持的 Provider 类型”错误。
- Surge 不再生成 ShadowsocksR external proxy。混合订阅中的 SSR 节点会被警告并
  省略，其它节点继续输出。
- 删除 `binPath`、`surgeConfig.resolveHostname` 和 `provider.startPort`。
- ShadowsocksR 的节点模型、订阅解析及 Clash、Quantumult X、Loon、portable 和
  Worker 输出仍然保留。

## 验证升级结果

所有项目先运行类型检查、lint 和本地生成：

```bash
pnpm check
pnpm gen
find dist -type f -exec shasum -a 256 {} + | LC_ALL=C sort \
  > /tmp/surgio-v4.sha256
diff -u /tmp/surgio-v3.sha256 /tmp/surgio-v4.sha256
```

文件数量和哈希应该一致。若远程订阅在迁移期间发生变化，应在相同缓存和尽可能短的
时间窗口内重试，并逐项调查差异，不能直接更新基线。

然后按部署方式继续验证：

- **本地 CLI**：生成所有 Artifact，并检查 `clean-cache`、upload 等实际使用命令。
- **Node Gateway**：启动真实 HTTP server，检查登录、鉴权、Artifact、Provider
  export、订阅 headers 和静态资源。
- **Lambda**：使用平台 adapter 或真实 handler 请求验证状态码、headers 和 body。
- **Worker**：运行 `wrangler types --check`、workerd 集成测试和
  `wrangler deploy --dry-run`，检查 KV、Assets 和生产 bundle。
- **双运行时**：比较 Node 与 Worker 的代表性 Artifact 和 Provider 响应。

Worker bundle 不应包含 filesystem、完整 Nunjucks compiler、动态模块加载器、Got、
ioredis 或 Upstash client。最终还应搜索仓库，确认没有重复 Project、
`defineWorkerProject`、Redis 配置或只为 Surge SSR 保留的字段。
