---
title: 快速搭建托管 API
sidebarDepth: 1
---

# 快速搭建托管 API

:::tip 提示
本文亦发布于我的个人博客 [blog.dada.li](https://blog.dada.li/2019/surgio-api-gateway)
:::

## 前言

相信很多人都用过网络上处理规则的 API 接口，也有人在使用过 Surgio 后觉得更新规则不太灵活。虽然我们已经能够通过自动化的方法每隔一段时间更新一次规则，但还是无法做到实时更新。这篇文章就是想教大家，利用现成的 SAAS(Software as a Service) 服务，来实现一个 Surgio 规则仓库的 API。

## 简述实现

目前 Surgio 支持两个部署平台，阿里云函数服务和 zeit 的 now.sh。他们各自有各自的优缺点，由各位定夺使用谁（无法同时使用）。

### 阿里云函数

优点：

- 有免费额度
- 有香港机房

缺点：

- 管理复杂（文档很多很杂）

### now.sh <Badge text="推荐" vertical="middle" />

优点：

- 管理简单
- 有免费额度（几乎不可能用完）
- 有香港边缘服务器节点（源站位于美国）

缺点：

- 英文界面、文档

## 部署 - now.sh <Badge text="推荐" vertical="middle" />

### 准备

1. 注册一个 [now.sh](https://now.sh) 账号
2. 可以不绑定付款方式

### 配置

首先，安装工具链。

```bash
$ npm i -g now
```

登录账号。

```bash
$ now login
```

新建文件 `now.json`，注意修改代码中 `<...>` 部分。

```json
{
  "name": "<输入服务名 (例如 surgio-api)>",
  "version": 2,
  "public": false,
  "builds": [
    { 
      "src": "gateway.js",
      "use": "@now/node",
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
      "methods": ["HEAD", "GET"],
      "dest": "/gateway.js"
    }
  ]
}
```

在 `package.json` 中增加如下字段：

```json
{
  "engines": {
    "node": "10.x"
  }
}
```

### 编写云函数

新建文件 `gateway.js`。

```js
'use strict';

const gateway = require('surgio/build/gateway');

module.exports = gateway.createHttpServer();
```

### 配置

#### 接口鉴权

:::warning 注意
接口鉴权依赖使用新版的部署方法，旧的 `nowHandler` 不支持。
:::

在 `surgio.conf.js` 中增加如下字段：

```js
{
  gateway: {
    auth: true,
    accessToken: 'YOUR_PASSWORD',
  },
}
```

:::tip 提示
对于已经部署了托管接口的用户，推荐不要第一时间打开鉴权功能，而是配置 `accessToken` 一段时间后再将 `auth` 改为 `true`。这样可以让已经下载过旧托管文件的客户端更新到新的包含有 `access_token` 参数的托管文件。
:::

### 部署

```bash
$ now --prod
```

如果不出意外你会看到如图的信息，高亮的 URL 即为云函数服务的访问地址。

![carbon.png](https://i.typcdn.com/geekdada/8428848087_769637.png) 

为了让托管地址保持一致，你需要到 `surgio.conf.js` 把 `urlBase` 更新为：

```
https://xxxxxx.xxx.now.sh/get-artifact/
```

最后，再运行一次

```bash
$ now --prod
```

更新服务。

### 使用

:::tip 移步至
[托管 API 的功能介绍](/guide/api.md)
:::

### 最后

有几点需要大家注意的：

1. 每一次更新本地的代码，都需要执行一次 `now`，保证远端和本地代码一致
2. 访问日志、监控、域名绑定等复杂功能恕不提供教程
3. 如果访问地址泄漏，请立即删除云函数然后修改机场密码

## 部署 - 阿里云函数

首先需要确保本地 Surgio 版本已经更新到 v0.12.4 或更新。

### 准备

1. 注册一个阿里云账号，最好是国内的因为我不清楚国际版有什么差异
2. 开启 [云函数功能](https://fc.console.aliyun.com)

### 配置

首先，安装[云函数工具链](https://github.com/alibaba/funcraft)。

```bash
$ npm install @alicloud/fun -g
```

在使用工具链之前，需要做一些基本的配置。在控制台中输入：

```bash
$ fun config
```

然后按照提示，依次配置 `Account ID`, `Access Key Id`, `Secret Access Key`, `Default Region Name`。关于服务区的选择，我建议避免使用大陆服务区。

在仓库中新建文件 `template.yml`，注意修改代码中 `<...>` 部分。

```yaml
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  <输入服务名 (例如 surgio-api)>:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: 'Surgio API service'
    get-artifact:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: gateway.handler
        Initializer: gateway.initializer
        CodeUri: './'
        Runtime: nodejs10
      Events:
        http-service:
          Type: HTTP
          Properties:
            AuthType: ANONYMOUS
            Methods: ['GET', 'HEAD']
```

新建文件 `.funignore`。

```
# Logs
logs/
*.log

# Dependency directories
!/node_modules/
```

### 编写云函数

新建文件 `gateway.js`。

```js
'use strict';

const gateway = require('surgio/build/gateway');

exports.initializer = gateway.initializer
exports.handler = gateway.handler;
```

### 部署

```bash
$ fun deploy
```

如果不出意外你会看到如图的信息，高亮的 URL 即为云函数服务的访问地址。

![carbon.png](https://i.typcdn.com/geekdada/8428849460_548622.png) 

### 使用

如果你已经配置好了一个 Artifact 名为 `surge.conf`，那该文件的访问地址就是：

```
https://1234567890.cn-hongkong.fc.aliyuncs.com/2016-08-15/proxy/surgio-api/get-artifact/surge.conf
```

为了让托管地址保持一致，你需要到 `surgio.conf.js` 把 `urlBase` 更新为：

```
https://1234567890.cn-hongkong.fc.aliyuncs.com/2016-08-15/proxy/surgio-api/get-artifact/
```

最后，再运行一次 `fun deploy` 更新服务。

### 最后

有几点需要大家注意的：

1. 每一次更新本地的代码，都需要执行一次 `fun deploy`，保证远端和本地代码一致
2. 访问日志、监控、域名绑定等复杂功能恕不提供教程
3. 如果访问地址泄漏，请立即删除云函数然后修改机场密码

## 最后的最后

API 能够极大地方便我们获取 Surgio 仓库中的规则。之后我还会为这个功能带来更多有趣的新特性。
