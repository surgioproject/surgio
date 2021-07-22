---
title: 快速搭建托管 API
sidebarDepth: 1
---

# 快速搭建托管 API

[[toc]]

## 前言

相信很多人都用过网络上处理规则的 API 接口，也有人在使用过 Surgio 后觉得更新规则不太灵活。虽然我们已经能够通过自动化的方法每隔一段时间更新一次规则，但还是无法做到实时更新。这篇文章就是想教大家，利用现成的 SAAS(Software as a Service) 服务，来实现一个 Surgio 规则仓库的 API。

目前 Surgio 支持两个部署平台，Vercel（推荐）和 Heroku。你也可以部署在自己的主机上，不过没有技术支持。

需要保证 Surgio 版本号大于 v1.20.0。

## 部署 - Vercel

### 准备

1. 注册一个 [Vercel](https://vercel.com) 账号
2. 可以不绑定付款方式

### 配置

首先，安装工具链。

```bash
$ npm i -g vercel
```

在项目中安装 `@surgio/gateway`。

```bash
$ npm i @surgio/gateway --save
```

:::tip 提示
之前已经使用了测试版的朋友请使用下面的命令升级到正式版。

```bash
$ npm i @surgio/gateway@latest --save
```
:::

登录账号。

```bash
$ vercel login
```

新建文件 `vercel.json`。

```json
{
  "version": 2,
  "public": false,
  "builds": [
    { 
      "src": "/gateway.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "provider/**",
          "template/**",
          "*.js",
          "*.json"
        ]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/gateway.js"
    }
  ]
}
```

在 `package.json` 中增加如下字段：

```json
{
  "engines": {
    "node": ">=14"
  }
}
```

### 编写云函数

新建文件 `gateway.js`。

```js
'use strict';

const gateway = require('@surgio/gateway');

module.exports = gateway.createHttpServer();
```

### 配置

#### 接口鉴权

:::warning 注意
不建议关闭鉴权！
:::

在 `surgio.conf.js` 中增加如下字段：

```js
module.exports = {
  gateway: {
    auth: true,
    accessToken: 'YOUR_PASSWORD',
  },
}
```

:::tip 提示
1. 完整的 gateway 配置可以在 [这里](/guide/custom-config.md#gateway) 查看。
2. 对于已经部署了托管接口的用户，推荐不要第一时间打开鉴权功能，而是配置 `accessToken` 一段时间后再将 `auth` 改为 `true`。这样可以让已经下载过旧托管文件的客户端更新到新的包含有 `access_token` 参数的托管文件。
:::

### 部署

```bash
$ vercel --prod
```

如果不出意外你会看到如图的信息，高亮的 URL 即为云函数服务的访问地址。

![carbon.png](https://i.typcdn.com/geekdada/8428848087_769637.png) 

为了让托管地址保持一致，你需要到 `surgio.conf.js` 把 `urlBase` 更新为：

```
https://xxxxxx.xxx.vercel.app/get-artifact/
```

最后，再运行一次

```bash
$ vercel --prod
```

更新服务。

### 使用

:::tip 移步至
[托管 API 的功能介绍](/guide/api.md)
:::

### 最后

有几点需要大家注意的：

1. 每一次更新本地的代码，都需要执行一次 `vercel`，保证远端和本地代码一致；
2. 访问日志、监控、域名绑定等复杂功能恕不提供教程；
3. 如果访问地址泄漏，请立即删除云函数然后修改机场密码；
4. 由于免费用户单次请求的超时时间为 10s，所以不建议使用过多的远程片段、较高的超时时间和重试机制。若你为付费用户，可以在 `vercel.json` 中加入以下的环境变量增加网络重试次数和超时时间。

   ```json
   {
     "env": {
       "SURGIO_NETWORK_RETRY": 2,
       "SURGIO_NETWORK_TIMEOUT": "10000"
     }
   }
   ```

## 部署 - Heroku

你可以在 [这里](https://github.com/surgioproject/heroku_demo) 找到完整的运行 Demo。

把你的规则仓库同步至 GitHub 后，到 Heroku 关联该项目。

![](../images/heroku_1.png)

关联项目后，开启 `master` 分支自动部署。你可以不开启这一项，后续如果需要更新服务代码则进行手动更新。

![](../images/heroku_2.png)

最后，手动触发一次部署。

![](../images/heroku_3.png)

你可能还需要更新 _surgio.conf.js_ 内 `urlBase` 的值。以这个 Demo 为例，它应该是：

```
https://surgio-demo.herokuapp.com/get-artifact/
```

## 自有服务器部署

```js
// gateway.js

'use strict';

const gateway = require('@surgio/gateway');

(async () => {
  const app = await gateway.bootstrapServer();
  await app.listen(3000, '0.0.0.0');
  console.log('> Your app is ready at http://0.0.0.0:3000');
})();
```

```bash
node gateway.js
```

## 最后的最后

API 能够极大地方便我们获取 Surgio 仓库中的规则。之后我还会为这个功能带来更多有趣的新特性。
