# 命令行功能

[[toc]]

## `generate`

> 生成所有 Artifact

```bash
$ npx surgio generate
```

### 可选参数

#### `--skip-fail`

略过 Artifact 生成过程中的错误。

:::tip 提示
推荐不要在 CI 环境使用这个参数
:::

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

## 全局参数

### `-V --verbose` 调试模式

> 开启调试日志
