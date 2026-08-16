# Gateway 迁移到 Cloudflare Worker 的 Checklist

这份清单用于将现有 Node gateway 迁移到独立 Worker 项目。本次 Surgio 改动不修改 gateway 仓库。

## 项目与构建

- [ ] 将 gateway 项目改为 ESM，Provider 改为 ESM 并通过 `providers` 显式注册。
- [ ] 新增 `surgio.worker.mjs`，删除运行时 Provider 目录扫描和 CommonJS module loader。
- [ ] 在 Wrangler 打包前执行 `buildWorkerManifest`，把 `.surgio/worker-manifest.mjs` 作为构建产物而非手工源码维护。
- [ ] 将 `.tpl`、`.json`、include/import 和 `templateString` 纳入 manifest 构建检查。
- [ ] 在 CI 执行 `wrangler deploy --dry-run`，审计 bundle 依赖、动态代码和 gzip 大小。
- [ ] 在 `wrangler.jsonc` 设置当前 compatibility date 和 `nodejs_compat`。

## 路由与响应

- [ ] 将 Nest/Express controller 改为 Fetch handler 或轻量 Worker router。
- [ ] 将 Artifact 路由映射到 `runtime.renderArtifact`，Provider 导出路由映射到 `runtime.renderProviders`。
- [ ] 使用返回值中的 `subscriptionUserInfo` 生成 `subscription-userinfo` header。
- [ ] 保留下载文件名、Content-Type、Content-Disposition、缓存控制和 CORS header 的现有行为。
- [ ] 对未知 Artifact、Provider、format 和 filter 返回稳定的 4xx 响应。
- [ ] 用 `getNodeListParams` 显式转发允许的 User-Agent 和请求 header。

## Bindings 与安全

- [ ] 创建 KV namespace，并配置 `SURGIO_CACHE` binding。
- [ ] 每个请求或 isolate 使用 `TtlCache` 和 `createCloudflareKvStore` 装配 runtime。
- [ ] 不把 Redis、Upstash 或对象存储凭据写入 Worker Surgio 配置。
- [ ] 将静态面板与资源迁移到 Workers Assets binding，并明确 SPA fallback 行为。
- [ ] 把 access token、viewer token 和管理凭据放入 Worker secrets。
- [ ] 在 Fetch 路由层实现鉴权，不依赖 Node cookie/session middleware。
- [ ] 为鉴权失败、token 轮换和日志脱敏建立测试。

## 缓存与一致性

- [ ] Provider、remote snippet 和 Artifact 只使用注入的 cache 实例。
- [ ] 管理端缓存清理只删除 Surgio namespace，不能清空整个 KV binding。
- [ ] UI 和运维文档说明 Cloudflare KV 的最终一致性，以及 list/reset 可能短暂看到旧状态。
- [ ] 为缓存冷启动、逻辑 TTL、损坏记录和上游失败降级建立 workerd 测试。

## 测试替换

- [ ] 将依赖 Node HTTP server、临时目录和动态 Provider 文件的测试拆成构建期测试与 Worker runtime 测试。
- [ ] 使用 Cloudflare Vitest integration 验证真实 KV、Fetch、Buffer、对象 TTL 和响应 header。
- [ ] 为所有公开导出格式建立 golden tests，并比较迁移前后的响应 body。
- [ ] 为远程 Surgio snippet 的允许语法和每一种禁止语法建立负向测试。
- [ ] 部署预览环境，验证静态资源、鉴权、冷缓存、跨区域读和缓存清理。
