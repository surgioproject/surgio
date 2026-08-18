# 命令行功能

[[toc]]

## `generate`

> 生成所有 Artifact

```bash
$ npx surgio generate
```

从 1.23.0 版本开始，Surgio 会在生成过程前进行前置的代码检查和修复。这个过程会方便不了解 JS 的用户进行问题修正，熟悉 ESLint 的用户也也可以自己配置 `.eslintrc` 来覆盖 Surgio 内置的规则。Surgio 默认开启了 ESLint 的 Fix 功能且无法关闭。

### 可选参数

#### `--cache-snippet`

> <Badge text="v2.4.0" vertical="middle" />

开启远程片段缓存。

:::tip 提示
默认的缓存时间为 12 小时，你可以通过设置 [环境变量](/guide/env.md#surgio-remote-snippet-cache-maxage) 来修改缓存时间
:::

#### `--skip-fail`

略过 Artifact 生成过程中的错误。

:::tip 提示
推荐不要在 CI 环境使用这个参数
:::

#### `--skip-lint`

略过前置代码检查（不建议）。

## `upload`

> 上传 Artifact

```bash
$ npx surgio upload
```

## `subscriptions`

> 查询 Provider 订阅流量

```bash
$ npx surgio subscriptions
```

:::tip 提示
1. 目前支持查询从 Header 中返回的流量信息和返回流量信息节点的订阅；
2. 不论 Provider 有没有被使用都会查询；
:::

## `new`

> 为 Surgio Project 新建 Provider、Artifact 或 Template

```bash
$ npx surgio new provider|artifact|template
```

该命令只操作 v4 的 `surgio.project.ts`、`.mts`、`.mjs` 或 `.js`，不再修改
legacy `surgio.conf.js`。运行前请先完成 [Project 配置迁移](/guide/getting-started.md#配置文件)。

- `new provider` 将配置直接写入 Project 的 `providers` registry。远程 Provider
  仅接受 HTTP/HTTPS URL；`custom` Provider 从空 `nodeList` 开始。
- `new artifact` 从当前 registry 选择主 Provider 和额外 Provider，并从实际的
  `templateDir` 递归读取 `.tpl` 与 `.json`。选择 JSON 时会自动设置
  `templateType: 'json'`。
- `new template` 在 `templateDir` 中创建空 `.tpl`，允许使用安全的相对子目录，
  但不会接受绝对路径、`..` 路径或覆盖已有文件。

自动编辑支持默认导出的静态对象或 `defineSurgioProject({...})`，也支持
TypeScript `satisfies`，以及引用同文件顶层静态 `const` 的 `providers` 对象和
`artifacts` 数组。动态函数、外部导入的容器或其他无法可靠定位的结构不会被
改写；命令会保持原文件不变并输出可手工粘贴的配置片段。

:::warning 注意
Provider registry key 和 Artifact 名称必须唯一。命令发现重复项时不会覆盖或修改
Project。
:::

## `doctor`

> 检查运行环境

```bash
$ npx surgio doctor
# @surgio/gateway: 0.12.2
# surgio: 1.20.2
# node: 12.16.2 (/usr/local/Cellar/node@12/12.16.2_1/bin/node)
# npx: 6.14.4
# yarn: 1.22.4
# npm: 6.14.4
```

## `lint`

> 检查代码格式 <Badge text="v2.0.0" vertical="middle" />

假设代码格式检查不通过，则 JS 极有可能无法正常运行，请耐心检查，也可以使用下面的命令自动修复一部分错误。

```bash
$ npx surgio lint --fix
```

### 可选参数

#### `--fix`

自动修复部分格式错误。

## `clean-cache`

> 清除缓存 <Badge text="v2.4.0" vertical="middle" />

## 全局参数

### `-V --verbose` 调试模式

> 开启调试日志
