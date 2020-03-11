---
title: 参与测试新版托管 API
sidebarDepth: 1
---

# 参与测试新版托管 API

## 安装新的网关组件

规则仓库目录内运行：

```bash
npm i @surgio/gateway@latest --save
```

同时需要保证 Surgio 版本号大于 v1.12.0。

## 修改 now.json

```json
{
  "version": 2,
  "public": false,
  "builds": [
    { 
      "src": "/gateway.js",
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
      "dest": "/gateway.js"
    }
  ]
}
```

## 修改 gateway.js

```js
'use strict';

const gateway = require('@surgio/gateway');

module.exports = gateway.createHttpServer();
```

## 部署

修改完后即可部署。由于是测试版，所以请不要在日常使用的域名下部署。为了安全起见请开启鉴权。

欢迎在交流群内汇报问题！

## 新增功能

### 1. Artifact 分类

Artifact 配置新增分类，方便在面板中找到想要的 Artifact。Surgio 内置了一些常用的类型，并且还为内置分类增加了个性化的功能。

`categories` 接受一个数组，数组内容可以自定也可以使用内置字段。

```js
const { categories } = require('surgio');

module.exports = {
  artifacts: [
    {
      name: 'SurgeV3.conf',
      template: 'surge_v3',
      provider: 'demo',
      categories: [
        'Maying',
        categories.SURGE,
      ],
    },
    {
      name: 'Surge.conf',
      template: 'surge',
      provider: 'demo',
      categories: [
        categories.SURGE,
      ],
    }
  ],
};
```

以下是所有的内置分类字段：

- `categories.SNIPPET` - 片段
- `categories.SURGE` - Surge
- `categories.QUANTUMULT_X` - Quantumult X 完整配置
- `categories.QUANTUMULT_X_SERVER` - Remote Server 片段
- `categories.QUANTUMULT_X_FILTER` - Remote Filter 片段
- `categories.QUANTUMULT_X_REWRITE` - Remote Rewrite 片段
- `categories.CLASH` - 完整 Clash 配置

### 2. 全新面板

### 3. 自有服务器部署

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
