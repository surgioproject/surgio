---
name: migrate-v3-config
description: 将 Surgio v3 配置仓库迁移为原生 TypeScript ESM Project，并根据用户选择保留非 Worker 部署、Worker 部署或两者并存。用于迁移 surgio.conf.js、provider 目录、Artifact 配置、Node Gateway 或 Worker 部署；开始前必须询问是否沿用原部署方式并区分 Worker 与非 Worker，但无论选择哪种部署方式都完成严格 TypeScript、行为 parity 和对应运行时验证，不引入 Bun、tsx 或运行时编译器。
---

# 迁移 Surgio v3 配置仓库

把迁移视为跨 Surgio、`@surgio/gateway` 和配置仓库的兼容性工作。先确认当前依赖提供下述 API；缺失时先在对应上游仓库补齐并验证，不要在配置仓库复制运行时实现。

## 保持边界

- 使用 Node.js `>=22.22.2` 原生 TypeScript type stripping。
- 保留 pnpm；不要引入 Bun、Bun binding、tsx、ts-node loader 或运行时转译。
- 无论最终是否部署 Worker，都把配置、Provider、Artifact 和实际部署入口迁移为 TypeScript。
- 使用唯一的 `surgio.project.ts` 服务本地生成，并按选择供 Node Gateway、Worker manifest 或两者使用。
- 保留 `.mts`、`.mjs`、`.js` Project 兼容入口，但多个 Project 文件必须报错。
- 仅在没有 Project 入口时回退到 `surgio.conf.js + provider/`；新旧入口并存必须报错。
- 保留现有 URL、Artifact 名称、Provider 名称、自定义参数、上传配置和凭据管理方式。
- 使用 `env(name)` 读取必须存在的字符串环境变量；不要引入特殊 secret 标记、递归配置替换或专用 resolver。不要强迫已有字面量改成环境变量，也不要在工具输出、测试快照或迁移文档中泄露凭据。
- Worker 只保证 Surgio 核心路径可运行；不要把 CLI、文件上传、运行时模板编译或任意 Node 模块带入 Worker。

## 先确认部署方式

在修改部署入口、依赖或脚本前，先检查现有 server、Gateway、Lambda、Wrangler、容器和平台配置。若用户尚未明确目标，必须先问一个简短问题：

> 当前仓库使用的是 `<识别到的部署方式>`。这次是否沿用？如果不沿用，目标是非 Worker、Cloudflare Worker，还是两者并存？

不要因为 Surgio 支持 Worker 就自动加入 Worker 部署，也不要因为原仓库只有 Node 就排除 Worker。记录用户选择并按以下分支执行：

- **沿用非 Worker**：保留现有 Node、容器、Lambda 或其它非 Worker adapter 和部署命令；把配置及对应入口迁移为 `.ts`，不要新增 Wrangler、KV、Worker manifest 或 Worker 专用依赖。
- **沿用 Worker**：保留现有 Worker 路由、bindings、Assets、域名和部署命令；把 Project、Provider、build script 和 Worker entry 迁移为 `.ts`。
- **两者并存**：让本地 CLI、非 Worker adapter 和 Worker 共用一个 `surgio.project.ts`；把平台差异限制在 adapter、bindings、cache 和 `nodeOptions()`。
- **切换部署方式**：只有用户明确授权时才删除旧 adapter、旧脚本和平台配置；先保存旧行为基线，再验证目标平台。

无论选择哪个分支，都必须完成 TypeScript 迁移、`strict` 类型检查、本地 Artifact parity 和所选运行时的真实验证。若用户已经在请求中明确选择部署方式，不要重复询问。

## 先做基线与盘点

1. 读取各仓库的 `AGENTS.md`、package scripts、Node/pnpm 版本和未提交改动。
2. 使用 `rg` 盘点：
   - `surgio.conf.js`、`surgio.project.*`、`provider/**/*.js`；
   - Artifact、模板目录、JSON `extendTemplate`；
   - Gateway、server、Lambda、Worker 和容器入口；
   - 若存在 Worker，盘点 Wrangler KV、Assets 和 secrets；
   - Bun、tsx、Got、Redis/ioredis、全局缓存和动态模块加载。
3. 先在原配置上执行本地生成，记录所有 `dist` 文件数量和 SHA-256：

   ```bash
   pnpm gen
   find dist -type f -exec shasum -a 256 {} + | LC_ALL=C sort > /tmp/surgio-before.sha256
   ```

4. 保存所选部署方式的代表性响应：非 Worker 记录真实服务或 handler，Worker 记录 Worker/Gateway 路由。不要只依赖 TypeScript 编译。
5. 保留用户已有的 package、lockfile 和部署改动；只修改迁移所需部分。

## 确认 Surgio 侧能力

要求 Surgio 提供：

- `surgio/project`
  - `defineSurgioProject`
  - `env`
  - Provider authoring helpers
  - `NodeTypeEnum`
  - `ProjectProviderContext`
  - `ArtifactConfigInput`、`PossibleNodeConfigInputType`
  - `JsonObject`、`ExtendContext`
  - `SurgioNodeOptions`
- 本地 CLI 或非 Worker 使用 `surgio/runtime` 和 `surgio/runtime/node`
- Worker 分支才要求 `surgio/worker`、`surgio/worker/build`
- Worker 分支才要求 `surgio/cache/core`、`surgio/cache/cloudflare`

确保 Project resolver：

1. 按 `surgio.project.ts`、`.mts`、`.mjs`、`.js` 发现入口。
2. 接受零个或一个 Project 文件；发现多个时列出冲突文件。
3. CLI 和 Node runtime 共用 resolver；选择 Worker 时，Worker manifest builder 也共用它。
4. Worker 分支中，builder 未显式传入 `configFile` 时自动发现 Project，不硬编码 `.mjs`。
5. Node 通过动态 `import()` 直接加载 `.ts`，不使用 Babel、tsx 或 loader。

让 Surgio CLI linter解析 `.ts/.mts`：

- 为 TypeScript 文件配置 `typescript-eslint` parser。
- 关闭 TypeScript 文件上的核心 `no-undef`，由 TypeScript 检查名称解析。
- 忽略 `.surgio/**`、`dist/**`、`node_modules/**` 和生成的 `.d.ts`。
- 仍允许纯 JavaScript legacy fixture；不要显式传入一个可能没有匹配文件的 `**/*.{ts,mts}` pattern。
- 增加真实 TypeScript 语法回归测试，而不是只把 `.mjs` 改名为 `.ts`。

若 Artifact `extendTemplate` 的 Zod 输入类型暴露成 `(unknown) => unknown`，将 validator 的函数类型声明为实际 `ReturnType<ExtendFunction>`，避免配置仓库被迫使用不安全断言。

## 建立统一 Project

先让独立配置对象通过纯类型检查：

```ts
import type { SurgioProjectConfig } from 'surgio/project'

const config = {
  artifacts,
} satisfies SurgioProjectConfig

export default config
```

创建 `surgio.project.ts`：

```ts
import {
  defineSurgioProject,
  type SurgioNodeOptions,
} from 'surgio/project'

import config from './config.ts'
import demo from './provider/demo.ts'

export default defineSurgioProject({
  ...config,
  providers: { demo },
  templateDir: './template',
})

export const nodeOptions = async (): Promise<SurgioNodeOptions> => ({
  output: './dist',
  cache: { type: 'filesystem' },
  upload: existingUploadConfig,
})
```

遵循以下投影规则：

- Surgio 配置字段直接写在 Project 顶层；导入已有 `config` 对象时使用 `...config`，不要保留 `{ config: config }` 嵌套。
- 不使用运行时 identity helper 包裹 config；TypeScript 配置统一使用 `satisfies SurgioProjectConfig`，legacy JavaScript 直接导出普通对象。
- `providers` 和 `templateDir` 是 Project 元数据。Surgio 内部会先剥离它们，再把剩余字段作为 config 交给校验与 runtime；迁移仓库不要自行复制这层投影。
- 默认导出只包含 Node 和 Worker 都需要的配置、显式 Provider registry 和模板目录。
- 不要为了兼容旧草案同时输出顶层配置和 `config` 嵌套；统一 Project 只保留扁平结构。
- 把 `output`、filesystem/Upstash cache、upload 等 Node-only 设置放入 `nodeOptions()`。
- Worker manifest 构建不得导入或序列化 `nodeOptions`。
- 删除 Artifact 的 `destDir/destDirs` 只应发生在 Worker manifest 投影中，不要改变 Node 本地生成配置。
- Provider factory 需要 runtime cache、HTTP 或 logger 时，接受 `ProjectProviderContext`，不要访问 Node 全局单例。
- 把远程服务客户端改为 runtime `httpClient` + runtime `cache`，同时保留原 TTL。

确认统一 Project 可用后，再删除 `surgio.conf.js` 和旧的运行时 Provider 扫描依赖。不要留下第二份 Worker 配置。

## 将应用源码迁移为严格 TypeScript

把应用源码改为 `.ts`，包括：

- `artifacts.ts`
- `config.ts`
- `lib/**/*.ts`
- `provider/**/*.ts`
- `surgio.project.ts`
- 非 Worker adapter，例如 `server.ts` 或 Lambda handler
- Worker 分支的 `worker.ts`
- Worker 分支的 `scripts/build-worker.ts`

保留工具配置文件为 JavaScript也可以；“全部 TypeScript”指应用和部署入口，不要求无意义地改写 ESLint/Prettier 配置。

本地相对 import 显式使用 `.ts`；发布包 import 继续使用公开子路径。不要导入 Surgio 内部源文件。

使用严格、无输出的 `tsconfig.json`：

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
  "include": [
    "*.ts",
    "lib/**/*.ts",
    "provider/**/*.ts",
    "scripts/**/*.ts",
    "worker-configuration.d.ts"
  ],
  "exclude": [".surgio", "dist", "node_modules"]
}
```

添加直接的 TypeScript 开发依赖。使用与 Surgio 仓库一致的编译器版本，避免依赖传递安装。

## 修复类型，不绕过类型

禁止使用 `// @ts-nocheck`、扩大到 `any`、双重断言或关闭 `strict`。按数据边界修复：

- Artifact 数组使用 `satisfies ArtifactConfigInput[]`。
- Provider 节点使用 `NodeTypeEnum`，不要依赖数组推断把协议字符串拓宽成 `string`。
- 空节点数组声明为 `PossibleNodeConfigInputType[]`。
- 条件节点列表先声明为 `(PossibleNodeConfigInputType | null)[]`，再使用显式 type predicate 删除 `null`；不要依赖 `filter(Boolean)` 缩窄。
- `GetNodeListParams` 的自定义字段是 `unknown`：用 `typeof` 或严格布尔比较缩窄 token、hostname、feature flag 和数值。
- 动态 Provider 的 `nodeList` 可能是数组或函数：先保存局部变量并用 `typeof === 'function'` 缩窄，再在闭包中调用。
- 节点 union 不保证存在 `hostname`：使用 `'hostname' in node` 和 `typeof` 检查。
- JSON API 响应定义最小 interface，并把外部值保持为 `unknown`，不要把 `JSON.parse` 结果传播成 `any`。
- `TtlCache.wrap<T>` 显式提供缓存结果类型。
- JSON template extension 回调声明 `ExtendContext` 和 `JsonObject[]`，避免可选字段被推断为 `undefined` 而违反 `JsonObject`。
- `nodeOptions` 显式返回 `Promise<SurgioNodeOptions>`。
- Node 端口先转换为 `number`。

只使用 Node 原生可擦除语法：

- 使用 type/interface、`satisfies`、`as const` 和 type-only import。
- 不在配置仓库声明 TypeScript enum、parameter property、namespace runtime 或其它需要代码生成的语法。
- `erasableSyntaxOnly` 必须持续通过。

## 配置脚本和 lint

所有分支至少提供：

```json
{
  "scripts": {
    "gen": "SURGIO_GFW_FREE=1 surgio generate --cache-snippet",
    "typecheck": "tsc --noEmit",
    "check": "pnpm typecheck && eslint . \"**/*.{ts,mts}\""
  },
  "engines": {
    "node": ">=22.22.2"
  }
}
```

按部署分支添加脚本：

- 非 Worker：保留原部署命令，只把入口改为 TypeScript，例如 `"start": "SURGIO_GFW_FREE=1 node server.ts"`。
- Worker：添加 `build`、`types:worker`、`worker:dev`、`worker:test` 和 `worker:deploy`；让 `typecheck` 执行 `wrangler types --check && tsc --noEmit`。
- 两者并存：同时保留非 Worker 部署命令和 Worker scripts，二者引用同一个 Project。

为仓库 ESLint 配置 TypeScript parser，关闭 TS `no-undef`，并全局忽略 `.surgio/**`、`dist/**` 和 `worker-configuration.d.ts`。确保 `eslint .` 实际覆盖 `.ts`，不要把“没有报错”误认为已经 lint 了 TypeScript。

Worker 分支的构建脚本使用原生 top-level await：

```ts
import { buildGatewayWorker } from '@surgio/gateway/worker/build'

await buildGatewayWorker()
```

## 配置 Worker（仅 Worker 或双运行时分支）

让 Wrangler 指向 `worker.ts`，启用 `nodejs_compat`，声明 KV 和 Assets binding。使用 Wrangler 生成类型：

```bash
pnpm types:worker
pnpm typecheck
```

不要手写宽泛 `Env`。提交 `worker-configuration.d.ts`，并在 binding 或 compatibility date 改变后重新生成。

Worker 入口只装配平台依赖：

```ts
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

- 不注入专用 secret resolver。Cloudflare 在 `nodejs_compat` 且 compatibility date 不早于 `2025-04-01` 时会把文本变量和 Secrets 暴露给 `process.env`，Project 统一通过 `env()` 读取。
- 不要在 Worker import Node cache 聚合入口、filesystem、Upstash client 或 CLI。
- Worker Provider、remote snippet 和 Artifact 必须共用注入的 cache。

## 调整 Gateway

- 非 Worker Gateway 使用 `@surgio/gateway/node` 的 `startServer` 运行 `server.ts`，保留原监听地址、端口、静态资源和部署命令；不要引入 Bun server binding。
- Lambda 等其它非 Worker 平台保留对应 adapter，只把项目和入口迁移为 TypeScript。
- Worker Gateway 才生成 manifest、注入 KV/Assets 并修改 Worker build helper。

Worker 分支中，仅在调用者提供 `configFile` 时传给 Surgio：

```ts
await buildWorkerManifest({
  ...(options.configFile ? { configFile: options.configFile } : {}),
  outfile,
})
```

这样默认入口由 Surgio resolver 决定，配置仓库无需维护 `.mjs` 文件名。同步 Gateway README、Surgio Worker 文档和仓库 `AGENTS.md`。

## 按顺序验证

1. 所有分支先运行：

   ```bash
   pnpm check
   pnpm gen
   ```

2. 再次计算 Artifact 哈希并与迁移前逐文件比较：

   ```bash
   find dist -type f -exec shasum -a 256 {} + | LC_ALL=C sort > /tmp/surgio-after.sha256
   diff -u /tmp/surgio-before.sha256 /tmp/surgio-after.sha256
   ```

   文件数量和全部哈希必须一致。若上游远程数据可能变化，在同一缓存和尽可能短的时间窗口内比较，并调查每个差异，不能直接更新基线。

3. 非 Worker 分支：运行原部署 build/start/handler 流程，用真实 HTTP 请求或平台 adapter 测试确认成功，并在验证后终止临时进程。不要要求 Wrangler 或 workerd。
4. Worker 分支：运行 `pnpm types:worker`、`pnpm build`、`pnpm worker:test`、真实 workerd integration 和 Wrangler dry-run。
5. 双运行时分支：完整执行第 3、4 步，并比较两端代表性 Artifact/Provider 响应。
6. 在 Surgio 运行：类型消费者、unit、CLI、文档构建和 package-output consumer；只有修改或使用 Worker 能力时才运行 Worker types、workerd 和 Wrangler dry-run。
7. 在 Gateway 运行：build、lint、unit、e2e 和 packed package consumer；只运行所选 adapter 的集成测试。
8. Worker 分支扫描 Surgio fixture 与配置仓库两个生产 Worker bundle：

   ```bash
   rg -n "ioredis|@upstash/redis|fs-extra|winston|from ['\"]got|new Function|eval\(" .surgio/**/worker.js
   ```

   期望没有匹配。确认 gzip 体积低于部署套餐限制。
9. 扫描配置仓库，确认没有 Bun、tsx、重复 Project、遗留 `.js` 应用入口、特殊 secret 标记或专用 resolver。非 Worker 分支不应出现无授权新增的 Wrangler/Worker 文件。
10. 运行所有涉及仓库的 `git diff --check`，区分本次改动与原有 dirty worktree，保留用户无关改动。

## 处理常见失败

- `Cannot find surgio.project.mjs`：Gateway helper 仍硬编码旧文件名；让它省略默认 `configFile`。
- CLI 报 TypeScript parsing error：Surgio CLI linter 缺少 TypeScript parser 或没有按 Project 类型配置文件匹配。
- `Env is not defined`：先生成 Wrangler 类型；TS ESLint 配置关闭核心 `no-undef`。
- ESLint 扫描 `.surgio/dry-run/worker.js`：使用 flat-config 全局 ignore，而不只依赖 `.gitignore`。
- `No files matching **/*.{ts,mts}`：不要为 legacy 项目向 ESLint 传强制 pattern；依靠 flat config 的 `files` 让目录扫描发现 TS。
- 协议 `type` 被拓宽为 `string`：使用 `NodeTypeEnum` 和显式节点数组类型。
- conditional spread 仍拓宽 enum：让分支数组 `satisfies PossibleNodeConfigInputType[]`，或先构造有类型的局部数组。
- JSON extension 出现 `undefined` 不兼容：为回调提供 `JsonObject[]` 上下文类型。
- pnpm 在无 TTY 环境要求重建 `node_modules`：先确认 Node/pnpm 版本，使用非交互 CI 环境执行安装；网络受限时不要让失败安装长期占用或留下仓库内临时 store。

完成时报告用户选择的部署分支、实际命令、测试数量和 Artifact parity。非 Worker 分支报告真实服务/handler 状态；Worker 分支报告 workerd、dry-run、gzip 大小和 bundle 扫描结果；双运行时分支两者都报告。不要只报告“编译通过”。
