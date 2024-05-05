---
title: Surge 进阶 - 生成 SSR 订阅
sidebarDepth: 2
---

# Surge 进阶 - 生成 SSR 订阅

:::warning 注意
- 本文仅针对 Surge for Mac
- 如果你已经订阅了 Surge 4，推荐使用 [原生](/guide/custom-config.md#surgeconfig-v2ray) 的 Vmess 支持
:::

Surge 没有原生提供对 SSR 的支持 ~~（将来也不太可能）~~ ，但是提供了一个叫做 [External Proxy Provider](https://medium.com/@Blankwonder/surge-mac-new-features-external-proxy-provider-375e0e9ea660) 的功能，能够满足我们连接 SSR 服务器。

## 开始之前

在一切开始之前，你需要确保本地已经安装了 V2Ray 和 SSR 的可执行文件。

- [安装 SSR](/guide/install-ssr-local.md)

## 修改 Surgio 配置

找到 `surgio.conf.js`，补充如下字段：

```js{3-6}
module.exports = {
  // ...
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
  },
  resolveHostname: true,
}
```

:::tip 提示
关于 `resolveHostname` 的解释请看 [这里](/guide/custom-config.md#surgeconfig-resolvehostname)。
:::

## 生成

1. 确保模板中调用 `getSurgeNodes` 方法。
2. Provider 中包含 SSR 的订阅。

## 注意事项

1. 同样的一份 Surge 托管配置，其中的 SSR 节点能够在其它有二进制文件的电脑中启动。
2. 如果你能让 `~/.config/surgio` 同步起来，可以把二进制文件也放里面，那订阅对于这两种节点都是有意义的。注意 Surge 不能识别 `~/` 但是能识别 `$HOME/`。恕不提供更多支持。
