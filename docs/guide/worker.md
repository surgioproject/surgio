# 在 Cloudflare Workers 中运行 Surgio

`surgio/worker` 是不依赖 CLI、运行时文件系统和动态模块加载的核心运行时。TypeScript ESM 项目使用一份 `surgio.project.ts`，同时供本地 CLI、Node Gateway 和 Worker manifest 使用。Node.js 22.22.2 及以上版本会直接执行其中可擦除的 TypeScript 语法，不需要 Bun、tsx 或运行时编译器。

Worker 必须启用 [`nodejs_compat`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)。这项兼容标志用于 `Buffer`、`node:crypto`、`node:net` 和 `node:dns`，并不允许 Worker 在运行时读取 Surgio 项目目录。

## 定义统一 Project

新建 `surgio.project.ts`：

```ts
import {
  defineClashProvider,
  defineSurgioProject,
  env,
} from 'surgio/project'

export default defineSurgioProject({
  artifacts: [{ name: 'demo.conf', provider: 'demo', template: 'surge' }],
  providers: {
    demo: () =>
      defineClashProvider({
        url: env('DEMO_SUBSCRIPTION_URL'),
      }),
  },
  templateDir: './template',
})

export const nodeOptions = async () => ({
  output: './dist',
  cache: { type: 'filesystem' },
  upload: {
    accessKeyId: env('UPLOAD_ACCESS_KEY_ID'),
    accessKeySecret: env('UPLOAD_ACCESS_KEY_SECRET'),
  },
})
```

Project 和 Provider 只支持 ESM。Surgio 配置字段直接写在 Project 顶层，`providers` 和 `templateDir` 是 Project 元数据。每个 Provider 都必须在 `providers` 中显式注册；Worker 不扫描 `provider` 目录。`output`、文件系统或 Upstash cache、upload 等 Node-only 设置放在命名导出的 `nodeOptions` 中。CLI 和 Node runtime 会读取它，Worker manifest 只读取默认导出的共享配置。

`env(name)` 从 `process.env` 读取字符串，缺失时抛错。Provider factory 在 runtime 创建 Provider 时执行，适合读取只存在于部署环境的变量；`nodeOptions()` 只在 Node 侧执行。Cloudflare Worker 必须使用 `nodejs_compat` 和不早于 `2025-04-01` 的 compatibility date，使文本变量和 Secrets 自动进入 `process.env`。KV、Assets 等结构化 binding 仍通过 Worker adapter 显式注入。

## 构建 manifest

构建脚本只在 Node 构建环境中运行：

```ts
// scripts/build-surgio-worker.ts
import { buildWorkerManifest } from 'surgio/worker/build'

await buildWorkerManifest({
  configFile: 'surgio.project.ts',
  outfile: '.surgio/worker-manifest.mjs',
})
```

构建器会读取 `.tpl` 和 `.json` 模板，检查 Artifact、Provider 和模板引用，并把 Nunjucks 模板及 `templateString` 预编译。include、import、本地 snippet 和模板 filters 在运行时仍可用。

Worker runtime 不公开 `renderString`，也不包含 Nunjucks compiler、`eval` 或 `new Function`。因此 `.surgio/worker-manifest.mjs` 必须在 Wrangler 打包前生成，不能在 Worker 中生成。

## 创建 runtime

```ts
import manifest from './.surgio/worker-manifest.mjs'
import { TtlCache } from 'surgio/cache/core'
import { createCloudflareKvStore } from 'surgio/cache/cloudflare'
import { createSurgioRuntime } from 'surgio/worker'

interface Env {
  SURGIO_CACHE: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cache = new TtlCache()
    cache.useStore(createCloudflareKvStore(env.SURGIO_CACHE))

    const runtime = createSurgioRuntime(manifest, { cache, fetch })
    const result = await runtime.renderArtifact('demo.conf', {
      getNodeListParams: {
        requestUserAgent: request.headers.get('user-agent') ?? undefined,
        requestHeaders: Object.fromEntries(request.headers),
      },
    })

    return new Response(result.body)
  },
}
```

`cache` 是必需依赖。Worker Provider、远程 snippet 和 Artifact 结果都使用这个实例，不会访问 Node 的 `unifiedCache` 单例。

`createSurgioRuntime` 还允许注入 `fetch`、`resolveDomain`、`logger` 和 `network`。默认 HTTP adapter 使用基于 Fetch 的 ky，与 Node.js 共用文本响应、headers、超时和有限重试逻辑。默认 DNS adapter 使用 `node:dns` 的 `resolve4` 和 `resolve6`，只合并同一进程内的并发查询，不做持久缓存；每次 DNS 查询都会计入 [Worker subrequest](https://developers.cloudflare.com/workers/runtime-apis/nodejs/dns/)。

## Runtime API

- `renderArtifact(name, options)` 渲染已定义 Artifact。
- `renderProviders(options)` 直接导出一组 Provider。
- `renderTemplate(name, context)` 渲染一个预编译模板。
- `listArtifacts()` 和 `listProviders()` 返回 manifest 中的静态目录。
- `getProviderSubscription(name, params)` 读取订阅元数据。
- `getGatewayConfig()` 返回 Gateway 所需的只读配置元数据。
- `resetCache()` 清理当前 Surgio namespace。
- `close()` 关闭调用方提供的缓存。

渲染结果是 `{ body, artifact, subscriptionUserInfo, subscriptionUserInfoMap }`，调用方不需要持有或观察可变的 `Artifact` 实例。

## 远程 snippet 限制

普通远程 ruleset 会按 TTL 下载并缓存。标记为 `surgioSnippet` 的远程模板使用安全子集解释器，仅支持：

- 一个 `main(arg, ...)` 宏；
- 文本、注释和 Nunjucks 空白控制；
- `{{ identifier }}` 参数插值。

属性访问、函数调用、filters、include、循环、条件和其它控制块会被拒绝，并报告行列位置。需要完整 Nunjucks 能力的 snippet 应改为本地 `.tpl`，由 manifest 构建器预编译。

## Wrangler 配置

```json
{
  "name": "surgio-worker",
  "main": "src/worker.ts",
  "compatibility_date": "2026-08-17",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [{ "binding": "SURGIO_CACHE", "id": "<KV namespace id>" }]
}
```

Cloudflare KV 是最终一致存储，跨区域读取、key list 和 reset 不能提供 Redis 的强一致语义。Surgio 在记录内执行精确的逻辑 TTL；Cloudflare 的物理过期只用于后端清理。

上线前运行 `wrangler deploy --dry-run --outfile .surgio/dist/worker.js --metafile .surgio/dist/meta.json`，检查 bundle 不包含 Node-only 后端依赖或动态代码，并确认 gzip 后低于当前 Worker 套餐限制。测试建议使用 [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/) 在 workerd 中验证真实 binding。

现有 gateway 的迁移边界见 [Gateway Worker checklist](/gateway-worker-checklist.md)。
