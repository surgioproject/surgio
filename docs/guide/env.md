---
title: 环境变量
sidebarDepth: 2
---

# 环境变量

:::warning 注意
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

### `SURGIO_REMOTE_SNIPPET_CACHE_MAXAGE`

- 默认值: `43200000`（12 小时）

### `SURGIO_PROVIDER_CACHE_MAXAGE`

- 默认值: `600000`（10 分钟）

### `SURGIO_DISABLE_SURGE_VMESS_AEAD`

- 默认值: `false`

是否关闭 Surge Vmess AEAD 加密。默认开启，如果您的服务器不支持 AEAD 加密，请关闭（`SURGIO_DISABLE_SURGE_VMESS_AEAD=true`）。
