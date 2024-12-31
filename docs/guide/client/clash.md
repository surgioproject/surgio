---
title: Clash
sidebarDepth: 2
---

# Clash

[[toc]]

本文旨在教大家如何使用 Surgio 维护 Clash 的规则。本文编写时 Surgio 支持两种维护 Clash 规则的方法，我们推荐您使用第一种方法，另一种方法可能会在将来废弃掉。

## 新的方法 <Badge text="推荐" vertical="middle" />

### 准备

首先我们找到一份基础的规则文件，它可能是这样的：

```yaml
allow-lan: true
mode: Rule
external-controller: 127.0.0.1:7892
port: 7890
socks-port: 7891

proxies:

proxy-groups:

rules:
```

### 编写 Proxy

我们利用 `getClashNodes`（[文档](/guide/custom-template.md#getclashnodes)）来获取完整的节点信息，然后把它转换成 JSON 格式。

```yaml {7}
allow-lan: true
mode: Rule
external-controller: 127.0.0.1:7892
port: 7890
socks-port: 7891

proxies: {{ getClashNodes(nodeList) | json }}

proxy-groups:

rules:
```

### 编写 Proxy Group

:::warning 注意
不同于旧的方法，过滤器需要按照模板的规则来使用，例如内置过滤器为 `netflixFilter`，自定义过滤器为 `customFilters.myFilter`。
:::

Clash 的 Proxy Group 有多种类型，这里分别举例。代码中的 `getClashNodeNames`（[文档](/guide/custom-template.md#getclashnodenames)）用于获取节点名。

```yaml {9-23}
allow-lan: true
mode: Rule
external-controller: 127.0.0.1:7892
port: 7890
socks-port: 7891

proxies: {{ getClashNodes(nodeList) | json }}

proxy-groups:
- type: select
  name: 🚀 Proxy
  proxies: {{ getClashNodeNames(nodeList) | json }} # 完整的节点列表
- type: select
  name: 🎬 Netflix
  proxies: {{ getClashNodeNames(nodeList, netflixFilter) | json }} # 过滤后的节点列表
- type: url-test # 或 fallback, load-balance
  name: US
  proxies: {{ getClashNodeNames(nodeList, usFilter) | json }}
  url: {{ proxyTestUrl }} # 可自己指定也可使用 Surgio 内置的地址
  interval: 1200
- type: select
  name: 📺 Youtube
  proxies: {{ getClashNodeNames(nodeList, youtubeFilter, ['US']) | json }} # 自定义组合节点

rules:
```

### 编写规则

下面例子中使用了本地和远程的规则片段，你可以在文档中找到对应的配置方法，或是在初始的仓库中找到相似的代码供参考。

```yaml {1,27-42}
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

allow-lan: true
mode: Rule
external-controller: 127.0.0.1:7892
port: 7890
socks-port: 7891

proxies: {{ getClashNodes(nodeList) | json }}

proxy-groups:
- type: select
  name: 🚀 Proxy
  proxies: {{ getClashNodeNames(nodeList) | json }} # 完整的节点列表
- type: select
  name: 🎬 Netflix
  proxies: {{ getClashNodeNames(nodeList, netflixFilter) | json }} # 过滤后的节点列表
- type: url-test # 或 fallback, load-balance
  name: US
  proxies: {{ getClashNodeNames(nodeList, usFilter) | json }}
  url: {{ proxyTestUrl }} # 可自己指定也可使用 Surgio 内置的地址
  interval: 1200
- type: select
  name: 📺 Youtube
  proxies: {{ getClashNodeNames(nodeList, youtubeFilter, ['US']) | json }} # 自定义组合节点

rules:
{{ remoteSnippets.netflix.main('🎬 Netflix') | clash }}
{{ blocked_rules.main('🚀 Proxy') | clash }}

# LAN
- DOMAIN-SUFFIX,local,DIRECT
- IP-CIDR,127.0.0.0/8,DIRECT
- IP-CIDR,172.16.0.0/12,DIRECT
- IP-CIDR,192.168.0.0/16,DIRECT
- IP-CIDR,10.0.0.0/8,DIRECT
- IP-CIDR,17.0.0.0/8,DIRECT
- IP-CIDR,100.64.0.0/10,DIRECT

# Final
- GEOIP,CN,DIRECT
- MATCH,🚀 Proxy
```

接下来即可生成最终规则。
