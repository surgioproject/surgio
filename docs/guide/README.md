---
title: 介绍
---

# 介绍

## 背景

基本上，市面上所有的「机场」都会针对各个客户端提供一套标准的配置文件。这些配置文件能够让绝大部分人免去自己去学习写规则的痛苦。有一部分人因为不满足于通用的规则自己去编写规则或者从网络上东拼西凑别人的规则，然后使用 lhie1 和 Fndroid 编写的工具合成，最终加入到不同的客户端中。这个过程略微繁琐并且很难做到完全自动化更新。

目前常见的代理软件除了 Surge 做到了无缝地跨平台（almost），其他代理软件大多都有自己的配置文件，然后通过兼容的方式去读取另一个软件的配置。Clash 虽然跨平台，但是目前来看安卓和 iOS 上还没有非常好的 Clash 客户端。也就是说，大部分人其实在桌面端和移动端使用着不一样的客户端，并且很有可能使用着多份配置文件。

「机场」遍地开花让很多人手上持着多个机场订阅。有的「机场」技术完备为不同人群提供了多样化的配置，有的却只能提供一个订阅链接，给使用者造成了不小的麻烦。

## 它是如何工作的？

Surgio 由两部分组成：一部分解析不同机场提供的订阅地址或者自己维护的节点列表，另一部分根据模板定义生成指定的规则。

Surgio 还包括了一个实用工具 —— 上传到阿里云 OSS，能够快速实现订阅功能。

## Surgio 适合谁？

如果你符合以下几点，那 Surgio 就是适合你的。

- 购买了两个以上的 「机场」
- 使用了两个以上的代理软件
- 对机场提供的规则不满意
- 会写点 JavaScript

## 特性

- 维护自己的私人小机场（支持 Shadowsocks, Vmess, Shadowsocksr 等类型的节点）
- 读取机场的订阅地址
- 同时生成针对不同客户端的配置
- 同样的规则可写成「可复用片段」，减少重复劳作
- 读取符合 Surge Ruleset 规范的远程片段
- 让 Surge 能够订阅 V2Ray 和 SSR

## 劝退

目前很多核心功能对动手能力不强的小白和不了解 JavaScript 的朋友来说还有一些门槛。如果你在使用过程中感到吃力，推荐使用以下工具：

- [lhie1/Rules](https://github.com/lhie1/Rules)

## Code of Conduct

Surgio 现在不会将来也不会记录或上报你使用的节点或订阅信息。

## 支持开发

感谢 Surgio 的支持者们！

<a href="https://opencollective.com/surgio"><img src="https://opencollective.com/surgio/contributors.svg?width=890" /></a>

<p>
  <a href="https://opencollective.com/surgio/donate" target="_blank">
    <img src="https://opencollective.com/surgio/donate/button@2x.png?color=blue" width=300 />
  </a>
</p>

<img src="/support.jpg" style="padding-top:20px;" width=300>
