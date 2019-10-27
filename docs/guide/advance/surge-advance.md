---
title: Surge 进阶 - 生成 SSR 和 V2Ray 订阅
sidebarDepth: 2
---

# Surge 进阶 - 生成 SSR 和 V2Ray 订阅

:::warning 注意
- 本文仅针对 Surge for Mac
- 如果你已经订阅了 Surge 4，推荐使用原生的 Vmess 支持
:::

Surge 没有原生提供对 V2Ray 和 SSR 的支持 ~~（将来也不太可能）~~ ，但是提供了一个叫做 [External Proxy Provider](https://medium.com/@Blankwonder/surge-mac-new-features-external-proxy-provider-375e0e9ea660) 的功能，能够满足我们连接 V2Ray 和 SSR 服务器。

## 开始之前

在一切开始之前，你需要确保本地已经安装了 V2Ray 和 SSR 的可执行文件。

- [安装 V2Ray](https://github.com/v2ray/homebrew-v2ray)
- [安装 SSR](/guide/install-ssr-local.md)

## 修改 Surgio 配置

找到 `surgio.conf.js`，补充如下字段：

```js
module.exports = {
  // ...
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
    v2ray: '/usr/local/bin/v2ray',
  },
}
```

## 完成

在 Artifact 中配置一个 V2Ray 订阅的 Provider 即可。

## 注意事项

1. SSR 节点能够在其它有二进制文件的电脑中启动，所以订阅是有意义的；
2. V2Ray 节点仅能在运行命令的电脑上启动，因为在生成 Surge 配置的同时，Surgio 会把所有 V2Ray 节点的配置写入到 `~/.config/surgio` 目录下。

P.S. 如果你能让 `~/.config/surgio` 同步起来，可以把二进制文件也放里面，那订阅对于这两种节点都是有意义的。注意 Surge 不能识别 `~/` 但是能识别 `$HOME/`。恕不提供更多支持。
