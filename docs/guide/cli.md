# 命令行功能

[[toc]]

## `generate`

> 生成所有 Artifact

```bash
$ npx surgio generate
```

从 1.23.0 版本开始，Surgio 会在生成过程前进行前置的代码检查和修复。这个过程会方便不了解 JS 的用户进行问题修正，熟悉 ESLint 的用户也也可以自己配置 `.eslintrc` 来覆盖 Surgio 内置的规则。Surgio 默认开启了 ESLint 的 Fix 功能且无法关闭。

### 可选参数

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
2. 不论 Provider 有没有被使用都会查询
:::

## `new`

> 新建助手 <Badge text="v1.16.0" vertical="middle" />

```bash
$ npx surgio new provider|artifact|template
```

:::tip 提示
1. 目前新建 Artifact 助手无法识别 `artifacts: require(...)` 这样的配置文件，可能会破坏文件结构；
:::

## `doctor`

> 检查运行环境 <Badge text="v1.21.0" vertical="middle" />

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

### 可选参数

#### `--fix`

自动修复部分格式错误。

## 全局参数

### `-V --verbose` 调试模式

> 开启调试日志
