---
title: 快速上手
---

# 快速上手

:::warning 注意
- 目前 Surgio 仅支持 Node.js 版本 >= 22.22.2
- 文档中出现的命令如无特殊说明都只能运行在 macOS, Linux 或者 WSL 上
:::

Surgio 本身以 ESM 发布。新项目使用唯一的 `surgio.project.ts`，Provider registry
和 Artifact 配置都直接写在 Project 中。现有 CommonJS 规则仓库仍可运行，但需要
迁移为 Project 后才能使用 `surgio new`。

## 安装 Node.js

:::tip 提示
如果已安装可跳过
:::

[前往下载 Node.js](https://nodejs.org/zh-cn/download/)

## 新建一个配置仓库

```bash
# 安装
npm init surgio-store my-rule-store

# 或 使用国内镜像安装
npm init surgio-store my-rule-store --use-cnpm

# 来到仓库目录
cd my-rule-store
```

## 术语解释

在进入正题之前，我们先解释一下核心的几个术语：

### Provider -- <small>提供方</small>

节点的提供方，可以是一个订阅地址也可以是一组节点的配置。

### Template -- <small>模板</small>

Surgio 根据模板来渲染指定的文件。

### Artifact -- <small>产品</small>

Surgio 生成出的规则就是「产品」。

:::tip 提示
以上三者的关系简单来说就是：Surgio 根据 Artifact 的定义将 Provider 的节点用 Template 生成出来可用的配置。
:::

## 目录结构

```txt {5,6}
./my-rule-store
├── node_modules
├── package-lock.json
├── package.json
├── surgio.project.ts
└── template
```

你只需要关心高亮的 *surgio.project.ts* 和 *template*。Provider 和 Artifact
都在 Project 内以结构化配置注册，不再为 Provider 创建单独的 CommonJS 文件。

仓库中已经包含了一些用于演示的代码。我们会在后面一节说明如何自定义它们。

## 生成规则

```bash
npx surgio generate
```

规则已经生成到 `dist` 目录了。

<img src="/images/generate-result.png" width="318">

## 上传规则

```bash
npx surgio upload
```

你也可以使用预设好的组合命令，生成后上传规则：

```bash
npm run update
```

:::warning 注意
请确保已配置对象存储上传后端。
:::

## 如何自定义

推荐想使用 Surgio 的朋友先熟悉一下三大件 Artifact, Provider 和 Template 分别包含什么功能再尝试自定义。

Surgio 提供了一个新建组件的助手命令，你可以通过它来初始化想要的组件。

```bash
npx surgio new [artifact|provider|template]
```

助手只支持 v4 Project。它只会编辑能够静态确认的 `providers` 对象和
`artifacts` 数组；遇到动态配置时不会写入文件，而是给出可手工粘贴的片段。
Template 可以建立在 `templateDir` 的相对子目录中，已有文件不会被覆盖。完整规则
参见 [`new` 命令说明](/guide/cli.md#new)。

## 样例

除了你使用 init 命令生成的初始仓库之外，你还可以在 [这里](https://github.com/geekdada/surgio/tree/master/examples) 找到其它使用样例。

## 升级 Surgio

确保你当前的版本和新版没有兼容性问题后，运行下面命令即可。

```bash
$ npm install surgio@latest
```

升级 API 网关

```bash
$ npm install @surgio/gateway@latest
```

## 配置文件

Surgio v4 的配置入口是目录内唯一的 `surgio.project.ts`（也支持 `.mts`、`.mjs`
和 `.js`）。默认导出使用 `defineSurgioProject` 定义 Project：

```ts
import { defineSurgioProject } from 'surgio/project'

export default defineSurgioProject({
  artifacts: [],
  providers: {},
  templateDir: 'template',
})
```

CLI 仅在 Project 入口不存在时兼容读取 `surgio.conf.js + provider/`；新旧入口不能
同时存在。
