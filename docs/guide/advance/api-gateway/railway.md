# 部署 - Railway

:::tip[提示]
1. 该方法要求代码仓库由 GitHub 托管，可为私有仓库
2. 已经部署其它平台的仓库可以修改之后增加部署到 Railway，互不影响
:::

## 准备

确保仓库已经迁移为 `surgio.project.ts`，然后安装 Gateway：

```bash
pnpm add surgio @surgio/gateway
```

### 开启接口鉴权

:::warning[注意]
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api#打开鉴权)。

### 增加启动入口

在代码库的根目录新建文件 `server.ts`，内容如下：

```ts
import { startServer } from '@surgio/gateway/node'

await startServer({
  hostname: '0.0.0.0',
  port: Number(process.env.PORT) || 3000,
})
```

Railway 通过 `PORT` 环境变量指定端口。`startServer()` 默认只监听 `127.0.0.1`，必须改为
`0.0.0.0` 才能从外部访问。

在 `package.json` 中补充启动脚本和 Node.js 版本：

```json
{
  "scripts": {
    "start": "node server.ts"
  },
  "engines": {
    "node": ">=22.22.2"
  }
}
```

前往 [Railway.app](https://railway.app?referralCode=tN8cxr) 注册账号。

## 新建项目

打开 [Railway.app](https://railway.app?referralCode=tN8cxr)，在 Dashboard 中新建项目，
选择从 GitHub 仓库部署，然后选择代码库。

Railway 会根据 `engines.node` 选择 Node.js 版本，根据 `pnpm-lock.yaml` 使用 pnpm 安装
依赖，最后运行 `start` 脚本。如果仓库根目录有 `Dockerfile`，Railway 会改用它构建，写法
参见 [Docker 部署](/guide/advance/api-gateway/docker)。

部署成功后，在服务的 Settings 中生成一个 Railway 域名，即可访问 Surgio 面板。今后代码库
的分支有更新，Railway 会自动拉取并部署。

:::tip[不要忘记！]
请不要忘记将 `surgio.project.ts` 中 `urlBase` 改为 Railway 的域名路径。
:::

## 配置项目

下面的内容属于自定义范畴，可跳过。如果你没有一定基础建议跳过。

### 自定义域名

在服务的 Settings 中可以绑定自己的域名，按照提示添加 DNS 记录即可。

### 修改环境变量

如果 `surgio.project.ts` 通过 `env()` 读取了订阅地址等变量，在服务的 Variables 页面中
添加它们。每次增删环境变量都会触发重新部署，一次要添加很多变量时建议批量粘贴。

## 配置 Redis 缓存

:::tip[此步骤可选，推荐配置]
[Redis 缓存教程](/guide/advance/redis-cache)
:::

在项目中添加 Railway 的 Redis 服务，然后在 Surgio 服务的 Variables 页面引用它的连接地址：

```
REDIS_URL=${{Redis.REDIS_URL}}
```

在 `nodeOptions()` 中设置 `cache: { type: 'redis' }` 后，Surgio 会读取 `REDIS_URL`。`REDIS_URL` 指向 Railway 私有网络，旧环境中该地址可能只解析到 IPv6，Surgio 的 Redis 客户端可以连接 IPv6 地址。

也可以改用 [Upstash REST 缓存](/guide/advance/upstash-cache)。

## 查看用量

你可以在 Railway 账户的用量页面查看本月的用量和费用。

## 使用

你可能还需要更新 `surgio.project.ts` 内 `urlBase` 的值，它应该类似：

```text
https://surgio-demo.up.railway.app/get-artifact/
```

:::tip[移步至]
[托管 API 的功能介绍](/guide/api)
:::
