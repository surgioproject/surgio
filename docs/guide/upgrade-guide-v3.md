# v3 升级指南

在 v3.0.0 中对原有的一些接口和行为进行了修改，你可能要花一些时间来解决这些问题。相信我，会很快。

**目录**

[[toc]]

## Node 版本升级

新版 Surgio 不再支持 Node v12，请使用 v18.0.0 以上版本。

## 如何升级 Surgio？

```bash
npm i surgio@latest @surgio/gateway@latest --save
```

## 废弃功能

请在你的仓库中搜索以下内容，然后根据提示进行修改。

- 通过 External Provider 方式让 Surge 支持 Vmess 协议
  > 请使用 Surge 原生的 Vmess 支持
- Surge 的 `custom` 节点格式
  > 移除 `surgioConfig.surgeConfig.shadowsocksFormat`
- `clashProxyConfig` 和 `proxyGroupModifier`
  > 详情请阅读 [https://url.royli.dev/YyKh1](https://url.royli.dev/YyKh1)
- `surgioConfig.clashConfig.ssrFormat: "legacy"`
  > 移除 `surgioConfig.clashConfig.ssrFormat`
- `patchYamlArray`
  > 详情请阅读 [https://url.royli.dev/xr9mj](https://url.royli.dev/xr9mj)
- 所有与 Quantumult 相关的功能
  > 请使用 Quantumult X
- 所有与 Mellow 相关的功能
  > 请使用其它客户端

## 配置项变更

所有的配置项都遵循一致的格式，不会再出现 `kebabe-case` 和 `camelCase` 混用的情况。

请在你的仓库中搜索并替换以下内容。

```
- udp-relay -> udpRelay
- obfs-host -> obfsHost
- obfs-uri -> obfsUri
```

## 新增功能

### Clash Meta 特性

#### Tuic（v5 和旧版本）

你可以通过开启 `clashConfig.enableTuic` 来为 Clash 订阅中的节点增加 Tuic 特性。

> [文档](/guide/custom-config.md#clashconfig-enabletuic)

#### Shadow TLS

你可以通过开启 `clashConfig.enableShadowTls` 来为 Clash 订阅中的节点增加 ShadowTls 特性。

> [文档](/guide/custom-config.md#clashconfig-enableshadowtls)

### Clash 特性

#### 支持 Wireguard 节点

你不需要修改任何配置，Surgio 会自动为你生成 Wireguard 节点。

### Surge 特性

#### 支持 Wireguard 节点

Surge 的 Wireguard 节点配置包含两部分，`[Proxy]` 和与之对应的节点配置。你需要在模板中增加 `getSurgeWireguardNodes` 生成 Wireguard 节点。

```ini
[Proxy]
{{ getSurgeNodes(nodeList) }}

{{ getSurgeWireguardNodes(nodeList) }}
```

#### Tuic (v5)

你不需要修改任何配置，Surgio 会自动为你生成 Tuic 节点。

### 针对客户端的节点名称生成方法

原来 Surgio 仅提供 `getNodeNames` 来生成节点名称，现在你可以使用下面的方法来生成针对特定客户端的节点名称。他们会自动过滤掉不支持的节点类型。

- `getClashNodeNames`
- `getQuantumultXNodeNames`
- `getSurgeNodeNames`
- `getSurfboardNodeNames`
- `getLoonNodeNames`

### 新的过滤器方法

#### reverseFilter

你可以使用 `reverseFilter` 来反转过滤器的结果。

```js
const notUSFilter = reverseFilter(usFilter)
```

#### mergeReversedFilters

你可以使用 `mergeReversedFilters` 来合并多个反转过滤器，`discardKeywords`, `discardProviders`, `discardGlob` 过滤器。


```js
// 丢弃 US 和包含 BGP 关键字的节点
const notUSAndNotBGP = mergeReversedFilters(
  [notUSFilter, discardKeywords(['BGP'])],
  true, // 严格模式
)

// 香港 BGP ✅
// 香港 IPLC ✅
// 洛杉矶 BGP 🚫
// 洛杉矶 IPLC ✅
```

### Provider 钩子函数

#### `afterNodeListResponse`

该钩子函数会在成功获取到远程订阅内容后执行。

> [文档](/guide/custom-provider.md#hooks-afternodelistresponse)

#### `onError`

该钩子函数会在获取远程订阅内容失败后执行。

> [文档](/guide/custom-provider.md#hooks-onerror)

### 自定义 Provider 增强

`nodeList` 参数支持使用异步函数，这意味着你能够动态生成节点列表，更棒的是，你能获取到当前节点获取请求的 URL 参数。例如，你可以在请求中包含参数 `hbo=1` 时输出包含 HBO 节点的订阅。

> [文档](/guide/custom-provider.md#异步模式)

### IDE 类型提示支持

Surgio 提供了下面的方法来支持 IDE 类型提示。他们的使用是完全可选的，你可以根据自己的喜好来使用。

- `defineSurgioConfig`
- `defineXxxxProvider` (例如 `defineClashProvider`)

### 内置工具

#### httpClient

`httpClient` 是一个 [Got](https://github.com/sindresorhus/got) 实例，你可以使用它来发起 HTTP 请求。Surgio 内置了代理环境变量识别，如果你已经设置了 `http_proxy` 或 `https_proxy` 环境变量，那么 `httpClient` 会自动使用代理。

#### cache

`cache` 是一个 [cache-manager](https://github.com/node-cache-manager/node-cache-manager) 实例，你可以使用它来缓存数据。假如你开启了 Redis 缓存，那么 `cache` 会自动使用 Redis，否则会使用内存缓存。

- `cache.get`
- `cache.set`
- `cache.del`
- `cache.reset`
- `cache.wrap`
- `cache.keys`
- `cache.mset`
- `cache.mget`
- `cache.mdel`
- `cache.has`
