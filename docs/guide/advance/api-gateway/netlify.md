# 部署 - Netlify Functions

[[toc]]

:::tip 提示
1. 该方法不要求代码托管平台，可为私有仓库（文章以 GitHub 为例）
2. 已经部署其它平台的仓库可以修改之后增加部署到 Netlify Functions，互不影响
3. 我们有一个运行的示例供你参考：[netlify-demo](https://github.com/surgioproject/netlify-demo)
:::

## 准备

确保 `surgio` 升级至 `v2.17.0` 或以上; `@surgio/gateway` 升级至 `v1.5.0` 或以上。

### 开启接口鉴权

:::warning 注意
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api.md#打开鉴权)。

### 增加平台配置

在代码库根目录新建文件 `netlify.toml`，内容如下：

```toml
[build]
  command = "exit 0"
  functions = "netlify/functions"
  publish = "."

[functions]
  included_files = [
    "node_modules/surgio/**",
    "node_modules/@surgio/**",
    "provider/**",
    "template/**",
    "*.js",
    "*.json"
  ]

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/index"
  status = 200
  force = true
```

在代码库根目录新建目录 `netlify/functions` 并新建文件 `netlify/functions/index.js`，内容如下：

```js
'use strict';

const gateway = require('@surgio/gateway');

module.exports.handler = gateway.createLambdaHandler();
```

将修改 push 到代码库。

## 部署

在 Netlify 中选择新建项目，并选择代码库平台。

![](/images/netlify-connect-to-git-provider.png)

授权成功之后即可选择代码库，然后会看到如下的页面：

![](/images/netlify-import-config.png)

点击 __Deploy site__ 按钮，即可部署。

## 配置 Redis 缓存

:::tip 此步骤可选，推荐配置

[教程](/guide/advance/redis-cache.md)
:::

## 查看用量

你可以在账户的 Billing 页面查询当月的用量。

## 使用

你可能还需要更新 _surgio.conf.js_ 内 `urlBase` 的值，它应该类似：

```
https://surgio-demo.netlify.app/get-artifact/
```

:::tip 移步至
[托管 API 的功能介绍](/guide/api.md)
:::
