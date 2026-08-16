---
sidebarDepth: 1
---

# 开启 Upstash REST 缓存

Serverless 平台的本地文件会在重新部署或实例回收后丢失。Upstash REST 使用无连接的 HTTP 接口，适合不能维持 Redis TCP 连接的运行环境。

## 创建数据库

在 Upstash 创建 Redis 数据库后，取得以下两项 REST 凭据：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

不要使用 `redis://` 或 `rediss://` 连接地址；Surgio 不再包含 Redis TCP 客户端。

## 配置环境变量

推荐把凭据设置为部署平台的 secret，然后使用最小配置：

```js
module.exports = {
  cache: {
    type: 'upstash',
  },
}
```

Surgio 会读取官方的 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 环境变量。

也可以显式指定其他环境变量：

```js
module.exports = {
  cache: {
    type: 'upstash',
    upstashRestUrl: process.env.MY_UPSTASH_REST_URL,
    upstashRestToken: process.env.MY_UPSTASH_REST_TOKEN,
  },
}
```

Upstash adapter 使用 Surgio 的统一 TTL 记录和 `surgio` namespace。清理缓存不会删除其他应用的数据。

Cloudflare Worker 项目应优先使用 KV binding，配置方式参见 [Cloudflare Worker](/guide/worker.md)。
