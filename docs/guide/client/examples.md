---
title: 代码示例
sidebarDepth: 2
---

# 代码示例

这些案例引用了我维护的代理规则，你也可以用相似的方法引用其它的远程片段。需要注意的是，我们只能引用 Surge 的远程片段。

对于 `Apple` 和 `Apple CDN` 这两个策略组，我强烈建议你使用内置的 `apple_rules.tpl`，它可以很好的解决苹果服务接口的访问和苹果全球 CDN 的访问分流。想了解更多细节可以阅读 [这篇文章](https://royli.dev/blog/2019/better-proxy-rules-for-apple-services)。

## Quantumult X + 远程规则

对于 QuantumultX 来说，根据国别来生成托管文件是一个比较好的管理方式。

在使用本仓库之前，你需要配置好阿里云 OSS 或者 Surgio 面板，这样才能让 QuantumultX 下载到托管文件。

[仓库](https://github.com/surgioproject/surgio/tree/master/examples/quantumultx)

## Clash + 远程规则

[仓库](https://github.com/surgioproject/surgio/tree/master/examples/clash-remote-snippet)

## 钩子函数

[仓库](https://github.com/surgioproject/surgio/tree/master/examples/hooks)
