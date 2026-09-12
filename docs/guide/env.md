---
title: 环境变量

---

# 环境变量

:::warning[注意]
以下环境变量仅供调试使用
:::

### `SURGIO_NETWORK_TIMEOUT`

- 默认值: `5000`
- 单位: 秒

### `SURGIO_NETWORK_RETRY`

- 默认值: `0`

举例，当最大重试次数为 2 时，加上原始的请求最多会请求 3 次。

### `SURGIO_NETWORK_CONCURRENCY`

- 默认值: `5`

<a id="surgio-remote-snippet-cache-maxage"></a>

### `SURGIO_REMOTE_SNIPPET_CACHE_MAXAGE`

- 默认值: `43200000`（12 小时）

### `SURGIO_PROVIDER_CACHE_MAXAGE`

- 默认值: `600000`（10 分钟）

### `SURGIO_RENDERED_ARTIFACT_CACHE_MAXAGE`

- 默认值: `604800000`（7 天）

Artifact 渲染结果的缓存时长，只在 Gateway 中生效，`surgio generate` 不使用这个缓存。

### `SURGIO_GATEWAY_ERROR_CACHE_MAXAGE`

- 默认值: `86400000`（1 天）

`gateway.useCacheOnError` 兜底副本的缓存时长。这份副本与渲染缓存分开存放，key 以
`artifact-fallback:` 开头。
