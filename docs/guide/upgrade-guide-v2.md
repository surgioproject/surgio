# v2 升级指南

在 v2.0.0 中对原有的一些接口和行为进行了修改，你可能要花一些时间来解决这些问题。相信我，会很快。

**目录**

[[toc]]

## Node 版本升级

新版 Surgio 不再支持 Node v10，推荐使用 v12。

## Gateway 面板

旧版的面板已经不再提供，请按照 [文档](/guide/advance/api-gateway.md) 部署新版面板。

## Surgio 配置修改

#### surgeConfig.vmess 默认改为 `native`

由于 Surge 新版已经发布了一段时间，故不再默认使用 External Provider 的方式输出 Vmess 节点。

#### surgeConfig.shadowsocksFormat 默认改为 `ss`

由于 Surge 新版已经发布了一段时间，故不再默认使用 `custom` 的方式输出 Shadowsocks 节点。

## 自定义过滤器

#### useProviders, discardProviders 默认开启严格模式

这个改变对于绝大部分用户没有影响，不过如果你原先使用这个过滤器来过滤一类包含了相同字段的 Provider，则需要手动关闭严格模式。

## Provider 修改

#### `udp-relay` 全部为布尔类型

历史上 `udp-relay` 允许如 `"true"`, `"false"` 这样的字符串，新版中将严格验证这个值的类型。你可以全局搜索替换解决。

#### 自定义 Vmess 节点新增 `udp-relay` 取代 `udp`

Custom 类型的 Provider 允许自定义 Vmess 节点。原来定义开启 UDP 转发的键名为 `udp`，新版改为 `udp-relay`。你可以全局搜索替换解决。
