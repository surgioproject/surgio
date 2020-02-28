# 命令行功能

[[toc]]

## `generate`

> 生成所有 Artifact

```bash
$ npx surgio generate
```

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

## 全局参数

### `-V --verbose` 调试模式

> 开启调试日志
