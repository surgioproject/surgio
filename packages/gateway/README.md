<p align="center">
    <a href="https://surgio.js.org/" target="_blank">
        <img width="180" src="https://raw.githubusercontent.com/geekdada/surgio/master/docs/.vuepress/public/surgio-icon.png" alt="logo">
    </a>
</p>

<h2 align="center">Gateway</h2>

[![NPM version][npm-image]][npm-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/@surgio/gateway.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@surgio/gateway
[snyk-image]: https://snyk.io/test/npm/@surgio/gateway/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/@surgio/gateway
[download-image]: https://img.shields.io/npm/dm/@surgio/gateway.svg?style=flat-square
[download-url]: https://npmjs.org/package/@surgio/gateway

## 文档

查看完整使用文档，前往 [surgio.js.org](https://surgio.js.org)。

## Hono Gateway

Gateway 使用一个 Hono app 实现全部 HTTP 路由，并通过子路径选择部署平台：

```js
import { createGatewayApp } from '@surgio/gateway'
import { startServer } from '@surgio/gateway/node'
import { createLambdaHandler } from '@surgio/gateway/lambda'
import { createWorkerGateway } from '@surgio/gateway/worker'
```

Node 项目只需要维护一个 `surgio.project.ts`，Node.js 22.22.2 及以上版本会直接运行其中可擦除的 TypeScript，`startServer()` 会从当前目录加载它。Cloudflare Worker 使用构建期 manifest：

```js
import { createWorkerGateway } from '@surgio/gateway/worker'
import { createCloudflareKvStore } from 'surgio/cache/cloudflare'
import { TtlCache } from 'surgio/cache/core'
import manifest from './.surgio/worker-manifest.mjs'

export default createWorkerGateway(manifest, {
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

`@surgio/gateway/worker/build` 的 `buildGatewayWorker()` 会同时生成 Surgio manifest 和准备前端 assets。Worker 需配置 `nodejs_compat`、KV 与 Assets binding。文本变量和 Secrets 通过 `process.env` 读取；KV、Assets 等结构化 binding 继续由 `bindings(env)` 注入。

## 订阅信息 API

`GET /api/providers` 返回 Provider 名称、类型、订阅 URL 和 `supportGetSubscriptionUserInfo`。管理 API 需要 admin 身份。

`GET /api/providers/:name/subscription` 返回 `{ status: 'ok', data }`。`data` 中的 `upload`、`download`、`used`、`left` 和 `total` 是带单位的流量字符串，`expire` 是日期与相对时间字符串。没有有效期时，`expire` 为 `无数据`；上游未提供订阅信息时，`data` 为 `null`。

## 交流

[<img width="207" src="https://raw.githubusercontent.com/geekdada/surgio/master/docs/.vuepress/public/join-telegram.png">](https://t.me/surgiotg)
