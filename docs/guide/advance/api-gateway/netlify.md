# 部署 - Netlify Functions

:::tip[提示]
1. 该方法不要求代码托管平台，可为私有仓库（文章以 GitHub 为例）
2. 已经部署其它平台的仓库可以修改之后增加部署到 Netlify Functions，互不影响
:::

## 准备

确保仓库已经迁移为 `surgio.project.ts`，然后安装 Gateway 和面板资源：

```bash
pnpm add surgio @surgio/gateway
pnpm add @surgio/gateway-frontend
```

Netlify 打包函数时只会带上代码中 import 的依赖。面板资源 `@surgio/gateway-frontend`
不会被 import，需要作为直接依赖安装，再通过下文的 `included_files` 加入函数包。

### 开启接口鉴权

:::warning[注意]
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api#打开鉴权)。

### 增加平台配置

在代码库根目录新建文件 `netlify.toml`，内容如下：

```toml
[build]
  command = "mkdir -p public"
  publish = "public"

[functions]
  external_node_modules = ["surgio", "@surgio/gateway"]
  included_files = [
    "surgio.project.ts",
    "provider/**",
    "template/**",
    "node_modules/@surgio/gateway-frontend/**",
  ]
```

- `publish` 指向一个空目录，避免把配置源码作为静态文件发布。
- `external_node_modules` 让 Netlify 完整复制 Surgio 和 Gateway，而不是打包它们。Gateway
  在运行时才加载 Surgio 的部分模块，打包工具无法追踪这些依赖。
- `included_files` 加入 Project、Provider、模板和面板资源。如果 `surgio.project.ts` 还
  import 了其它本地文件，也需要把它们加进来。

新建文件 `netlify/functions/gateway.ts`，内容如下：

```ts
import { createNodeGatewayApp } from '@surgio/gateway/node'
import { loadSurgioProject } from 'surgio/project'

const app = createNodeGatewayApp({
  project: await loadSurgioProject(process.cwd()),
})

export default (request: Request) => app.fetch(request)

export const config = {
  path: '/*',
}
```

`path: '/*'` 让所有请求都交给 Gateway 处理。

在代码库根目录新建文件 `.node-version`，内容为 `24`。Netlify 会用这个版本构建，函数
运行时也会使用同一个 Node.js 版本。

将修改 push 到代码库。

## 部署

在 Netlify 中选择导入已有项目，并选择代码库平台。授权成功之后选择代码库，构建设置会从
`netlify.toml` 读取，不需要修改，直接部署即可。

之后每次 push 到部署分支，Netlify 都会自动重新部署。

## 配置环境变量

如果 `surgio.project.ts` 通过 `env()` 读取了订阅地址等变量，需要在 Netlify 项目的环境
变量设置中添加它们，作用范围需要包含 Functions。修改环境变量后需要重新部署才会生效。

## 配置 Upstash REST 缓存

:::tip[此步骤可选，推荐配置]

[Upstash REST 缓存教程](/guide/advance/upstash-cache)
:::

## 查看用量

你可以在账户的 Billing 页面查询当月的用量。

## 使用

你可能还需要更新 `surgio.project.ts` 内 `urlBase` 的值，它应该类似：

```text
https://surgio-demo.netlify.app/get-artifact/
```

:::tip[移步至]
[托管 API 的功能介绍](/guide/api)
:::
