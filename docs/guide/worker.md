# 在 Cloudflare Workers 中运行 Surgio

`surgio/worker` 是不依赖 CLI、运行时文件系统和动态模块加载的核心运行时。Node CLI 与现有 CommonJS 项目不需要迁移；只有 Worker 项目必须使用 ESM、构建期 manifest 和显式 Provider registry。

Worker 必须启用 [`nodejs_compat`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)。这项兼容标志用于 `Buffer`、`node:crypto`、`node:net` 和 `node:dns`，并不允许 Worker 在运行时读取 Surgio 项目目录。

## 定义 Worker 项目

新建 `surgio.worker.mjs`：

```js
import { defineClashProvider, defineWorkerProject } from 'surgio/worker/config'

const demoProvider = defineClashProvider({
  url: 'https://example.com/subscription',
})

export default defineWorkerProject({
  config: {
    artifacts: [{ name: 'demo.conf', provider: 'demo', template: 'surge' }],
  },
  providers: {
    demo: demoProvider,
  },
  templateDir: './template',
})
```

配置和 Provider 只支持 ESM。每个 Provider 都必须在 `providers` 中显式注册；Worker 不扫描 `provider` 目录。`output`、`providerDir`、`configDir`、`binPath`、`upload` 和 `cache` 是 Node-only 配置，构建器会拒绝它们。

## 构建 manifest

构建脚本只在 Node 构建环境中运行：

```js
// scripts/build-surgio-worker.mjs
import { buildWorkerManifest } from 'surgio/worker/build'

await buildWorkerManifest({
  configFile: 'surgio.worker.mjs',
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
  "compatibility_date": "2026-08-16",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [{ "binding": "SURGIO_CACHE", "id": "<KV namespace id>" }]
}
```

Cloudflare KV 是最终一致存储，跨区域读取、key list 和 reset 不能提供 Redis 的强一致语义。Surgio 在记录内执行精确的逻辑 TTL；Cloudflare 的物理过期只用于后端清理。

上线前运行 `wrangler deploy --dry-run --outfile .surgio/dist/worker.js --metafile .surgio/dist/meta.json`，检查 bundle 不包含 Node-only 后端依赖或动态代码，并确认 gzip 后低于当前 Worker 套餐限制。测试建议使用 [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/) 在 workerd 中验证真实 binding。

现有 gateway 的迁移边界见 [Gateway Worker checklist](/gateway-worker-checklist.md)。
