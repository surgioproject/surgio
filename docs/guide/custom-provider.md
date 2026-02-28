---
title: Provider 服务提供者
sidebarDepth: 2
---

# Provider 服务提供者

你可以在 `provider` 目录内看到两个已经写好的 Provider，它们分别是订阅地址和自己维护的节点列表。

需要注意的是文件名即为该 Provider 的名称，后面在定义 Artifact 时会用到。

Surgio 内置了 `defineXxxProvider` 方法，`Xxx` 对应下面所列的类型，可以让 IDE 智能提示配置项，不过你也可以不使用这样的语法糖。下面两种写法都是可以的。

```js
const { defineClashProvider } = require('surgio')

module.exports = defineClashProvider({
  url: 'https://example.com/clash.yaml',
  // ...
})
```

```js
module.exports = {
  type: 'clash',
  // ...
}
```

## 支持异步函数

为了满足更多定制化的场景，支持通过异步函数的模式挂载 `Provider`

```js
const { defineCustomProvider } = require('surgio')

module.exports = defineCustomProvider(async function () {
  const myNodeList = await someAsyncFunction()

  return {
    nodeList: myNodeList,
  }
})
```

## 订阅类型

目前 Surgio 支持以下几种 Provider 类型：

|                       类型                       | 描述                                       | 备注                                                                                                                         |
| :----------------------------------------------: | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `custom` <Badge text="推荐" vertical="middle" /> | 自己维护的节点                             | 支持 Shadowsocks, Shadowsocksr, Snell, HTTPS, HTTP, Vmess, Vless, Hysteria 2, AnyTLS, Socks5, Tuic, Trojan, Wireguard                    |
| `clash` <Badge text="推荐" vertical="middle" />  | Clash 配置                                 | 支持 Shadowsocks, Shadowsocksr, Snell, HTTPS, HTTP, Vmess, Vless, Hysteria 2, AnyTLS, Socks5, Tuic, Trojan, Wireguard                  |
|                     `trojan`                     | Trojan 订阅                                | Shadowrocket 支持的 Trojan 订阅格式                                                                                          |
|           `shadowsocks_json_subscribe`           | 针对 Windows 客户端的 Shadowsocks 订阅地址 | 通常命名为 _gui-config.json_                                                                                                 |
|             `shadowsocks_subscribe`              | 通用的 Shadowsocks 订阅地址                |                                                                                                                              |
|             `shadowsocksr_subscribe`             | 通用的 Shadowsocksr 订阅地址               |                                                                                                                              |
|                `v2rayn_subscribe`                | V2rayN 订阅地址                            | 支持 V2Ray, Shadowsocks, [协议](https://github.com/2dust/v2rayN/wiki/%E8%AE%A2%E9%98%85%E5%8A%9F%E8%83%BD%E8%AF%B4%E6%98%8E) |
|                      `ssd`                       | SSD 订阅                                   | 支持 Shadowsocks                                                                                                             |

## Clash 订阅 <Badge text="推荐" vertical="middle" />

:::warning 注意
1. Surgio 支持读取 `obfs-local` 和 `v2ray-plugin` 两种 SIP003 插件配置；
2. 仅支持 `v2ray-plugin` 的 WebSocket 模式；
:::

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

### udpRelay

- 类型：`boolean`
- 默认值：`false`

我们发现部分机场的 Clash 订阅并没有设定 `udp`，所以你可以通过配置这个属性来强制设定节点的 UDP 转发支持情况。如果订阅节点中包含 `udp` 字段，则该配置无效。

### tls13

- 类型：`boolean`
- 默认值：`false`

强制开启节点的 TLS 1.3。

## Custom 自定义节点 <Badge text="推荐" vertical="middle" />

由自己维护的节点列表。

#### 普通模式

```js
const { defineCustomProvider } = require('surgio')

module.exports = defineCustomProvider({
  nodeList: [
    {
      type: 'shadowsocks',
      // ...
    },
  ],
})
```

#### 异步模式

> <Badge text="Surgio v3.0.0" vertical="middle" /><br />
> <Badge text="Gateway: v2.0.0" vertical="middle" />

异步模式下，Gateway 的 `/get-artifact` 请求参数会被传入到 `nodeList` 函数中。这样可以实现动态的节点列表。

`customParams` 是一个对象，包含了所有在 Artifact 和全局定义的自定义参数。假如你使用了 Gateway，则里面还包含所有请求 URL 中的参数。需要注意的是，URL 参数中所有的值都是字符串类型，例如 `mobile=true`，那么 `customParams.mobile` 的值就是 `'true'`。

`customParams` 默认会包含 `requestUserAgent`，方便你根据不同的客户端返回不同的节点列表。

:::tip 提示
如果你想了解如何编写更复杂的 Provider 请看 [这里](/guide/advance/advanced-provider.md)。
:::

```js
const { defineCustomProvider } = require('surgio')

module.exports = defineCustomProvider({
  nodeList: async (customParams) => {
    if (customParams.mobile === 'true') {
      return [
        {
          type: 'shadowsocks',
          // ...
        },
      ]
    } else {
      return [
        {
          type: 'trojan',
          // ...
        },
      ]
    }
  },
})
```

### Shadowsocks

```json5
{
  type: 'shadowsocks',
  nodeName: '🇺🇸US',
  hostname: 'us.example.com',
  port: 10000,
  method: 'chacha20-ietf-poly1305',
  password: 'password',
  obfs: 'tls', // tls, http, ws, wss
  obfsHost: 'gateway-carry.icloud.com',
  obfsUri: '/', // 当 obfs 为 ws 或 wss 时可配置
  udpRelay: true,
  tfo: false, // TCP Fast Open
  tls13: false, // TLS 1.3，适用于 v2ray-plugin
  mux: false, // 目前仅 Clash + Shadowsocks + v2ray-plugin 可用
  multiplex: {}, // 多路复用，可选，见本页面的 `multiplex 多路复用` 部分
}
```

:::warning 注意
1. `ws` 和 `wss` 是通过服务端 v2ray-plugin 支持的；
2. TLS 1.3 需要服务端支持
:::

### Shadowsocksr

```json5
{
  type: 'shadowsocksr',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 10000,
  method: 'chacha20-ietf',
  password: 'password',
  obfs: 'tls1.2_ticket_auth',
  obfsparam: 'music.163.com',
  protocol: 'auth_aes128_md5',
  protoparam: '',
  udpRelay: true,
  tfo: false, // TCP Fast Open
}
```

### Vmess

从 v3.5.0 开始 Surgio 支持了更多 Vmess 协议。为了更好地区分不同协议的参数，原有的 `host`, `path`, `wsHeaders` 将会在后面的版本中废弃，请使用下面列出的新属性。Surgio 会忽略代理客户端不支持的协议类型。

#### `network: 'tcp'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto', // 仅支持 auto/aes-128-gcm/chacha20-ietf-poly1305/none
  network: 'tcp',
  alterId: '64',
  port: 8080,
  tls: false,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true, // 开启 UDP 转发
}
```

#### `network: 'http'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto',
  network: 'http',
  alterId: '64',
  port: 8080,
  tls: false,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true,
  httpOpts: {
    method: 'GET',
    path: ['/', '/video'],
    headers: {
      'x-key': 'x-value',
    },
  },
  multiplex: {}, // 多路复用，可选，见本页面的 `multiplex 多路复用` 部分
}
```

#### `network: 'ws'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto',
  network: 'ws',
  alterId: '64',
  port: 8080,
  tls: false,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true,
  wsOpts: {
    path: '/',
    headers: {
      Host: 'www.example.com',
    },
  },
  multiplex: {}, // 多路复用，可选，见本页面的 `multiplex 多路复用` 部分
}
```

#### `network: 'grpc'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto',
  network: 'grpc',
  alterId: '64',
  port: 8080,
  tls: false,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true,
  grpcOpts: {
    serviceName: 'example',
  },
  multiplex: {}, // 多路复用，可选，见本页面的 `multiplex 多路复用` 部分
}
```

#### `network: 'h2'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto',
  network: 'h2',
  alterId: '64',
  port: 8080,
  tls: false,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true,
  h2Opts: {
    path: '/',
    host: ['www.example.com'],
  },
}
```

#### `network: 'quic'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto',
  network: 'quic',
  alterId: '64',
  port: 8080,
  tls: true,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true,
}
```

#### `network: 'httpupgrade'`

```json5
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto',
  network: 'httpupgrade',
  alterId: '64',
  port: 8080,
  tls: false,
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  udpRelay: true,
  httpUpgradeOpts: {
    path: '/',
    host: 'www.example.com',
    headers: {
      'x-key': 'x-value',
    }
  },
}
```

### Vless

Vless 节点遵循和 Vmess 类似的配置规则，除了以下几个差异：

1. Surgio 默认所有的 Vless 节点都已开启 TLS，因为这是安全的做法
2. 你可以设置 `flow` 属性，但是支持与否取决于客户端的支持情况
3. 你可以额外配置 `realityOpts` 用于控制 Reality，比如
   ```json5
   {
     nodeName: '🇭🇰HK',
     type: 'vless',
     hostname: 'hk.example.com',
     method: 'none',
     network: 'tcp',
     port: 8080,
     uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
     udpRelay: true,
     realityOpts: {
       publicKey: 'public-key',
       shortId: 'short-id', // 可选
     },
     encryption: "", // 可选，参考 https://wiki.metacubex.one/config/proxies/vless/#encryption
   }
   ```
4. `method` 有且仅有 `none` 一个选项

### Snell

```json5
{
  type: 'snell',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 10000,
  psk: 'RjEJRhNPps3DrYBcEQrcMe3q9NzFLMP',
  obfs: 'tls', // tls 或 http 或不传
  obfsHost: 'gateway-carry.icloud.com', // 可选
  version: 4, // 可选，默认不传以 Surge 为准
  reuse: true, // 可选，默认 false
}
```

### HTTPS

```json5
{
  type: 'https',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 443,
  username: 'username',
  password: 'password',
  tls13: false, // TLS 1.3
  path: '/', // 可选
  headers: { // 可选
    'x-key': 'x-value',
  },
}
```

### HTTP

```json5
{
  type: 'http',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 8080,
  username: 'username',
  password: 'password',
  path: '/', // 可选
  headers: { // 可选
    'x-key': 'x-value',
  },
}
```

### Trojan

```json5
{
  type: 'trojan',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 443,
  password: 'password',
  sni: 'example.com', // 可选
  alpn: ['http/1.1'], // 可选
  skipCertVerify: true, // 可选
  udpRelay: true, // 可选
  tls13: false, // TLS 1.3
  network: 'ws', // 可不填
  wsPath: '/', // 可选
  wsHeaders: {}, // 可选
  multiplex: {}, // 多路复用，可选，见本页面的 `multiplex 多路复用` 部分
}
```

### Socks5

```json5
{
  type: 'socks5',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 80,
  username: 'username', // 可选
  password: 'password', // 可选
  tls: true, // 可选
  skipCertVerify: true, // 可选
  udpRelay: false, // 可选，仅 Clash 支持
  sni: 'example.com', // 可选，仅 Surge 支持
  tfo: true, // 可选，仅 Surge 支持
  clientCert: 'item', // 可选，仅 Surge 支持
}
```

`clientCert` 仅 Surge 支持，参考 [文档](https://github.com/Blankwonder/Surge-Manual/blob/master/release-note/surge-mac.md#version-250) 进行配置。

### Wireguard

理论上你可以设置多个 Peer，但是目前仅 Surge 支持多个 Peer 的配置，其它客户端需要自行分拆成多个相互独立的配置。

```json5
{
  type: 'wireguard',
  nodeName: 'Wireguard',
  selfIp: '172.16.0.2',
  privateKey: 'eOyyaXrwVTHwo62x98Is6v5Fo=',
  peers: [
    {
      publicKey: 'eOyyaXrwVTHwo62x98Is6v5Fo=',
      endpoint: 'wg.example.com:54321',
      allowedIps: '172.16.0.0/24', // 可选
      keepalive: 25, // 可选
      presharedKey: 'eOyyaXrwVTHwo62x98Is6v5Fo=', // 可选
      reservedBits: [16], // 可选
    },
  ],
  selfIpV6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', // 可选
  preferIpv6: false, // 可选
  mtu: 1420, // 可选
  dnsServers: ['1.1.1.1'], // 可选
  reservedBits: [16], // 可选
}
```

### Tuic

#### V5

> <Badge text="Surgio v3.0.0" vertical="middle" />

```json5
{
  type: 'tuic',
  nodeName: 'Tuic',
  hostname: 'tuic.example.com',
  port: 443,
  password: 'password',
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  version: 5,
  sni: 'sni.example.com', // 可选
  skipCertVerify: true, // 可选
  alpn: ['h3'], // 可选，Stash 不支持空值
  udpRelay: false, // 可选，仅 Clash 支持更改，Surge 默认开启
}
```

#### 老版本协议

```json5
{
  type: 'tuic',
  nodeName: 'Tuic',
  hostname: 'tuic.example.com',
  port: 443,
  token: 'password',
  sni: 'sni.example.com', // 可选
  skipCertVerify: true, // 可选
  alpn: ['h3'], // 可选，Stash 不支持空值
  udpRelay: false, // 可选，仅 Clash 支持更改，Surge 默认开启
}
```

### Hysteria

> <Badge text="Surgio v3.1.0" vertical="middle" />

Surgio 只支持 Hysteria v2 协议。请注意，Hysteria v2 协议和 v1 协议完全不兼容。当前可以为 Clash 和 Surge 生成此节点。

Clash 需要在配置中开启 `clashConfig.enableHysteria2`。

```json5
{
  type: 'hysteria2',
  nodeName: 'Hysteria',
  hostname: 'hysteria.example.com',
  port: 443,
  password: 'password',
  downloadBandwidth: 40, // 可选，Mbps
  uploadBandwidth: 40, // 可选，Mbps
  sni: 'sni.example.com', // 可选
  skipCertVerify: true, // 可选
}
```

### AnyTLS

当前支持为 Clash、Surge 和 sing-box 生成 AnyTLS 节点。

```json5
{
  type: 'anytls',
  nodeName: 'AnyTLS',
  hostname: 'anytls.example.com',
  port: 443,
  password: 'password',
  udpRelay: false, // 可选
  sni: 'sni.example.com', // 可选
  alpn: ['h2', 'http/1.1'], // 可选
  skipCertVerify: false, // 可选
  idleSessionCheckInterval: 0, // 可选
  idleSessionTimeout: 0, // 可选
  minIdleSessions: 0, // 可选
}
```

## SSD 订阅

```js
module.exports = {
  type: 'ssd',
  url: '',
  udpRelay: true,
}
```

:::warning 注意
1. Surgio 支持读取 `simple-obfs` 和 `v2ray-plugin` 两种 SIP003 插件配置；
2. 仅支持 `v2ray-plugin` 的 WebSocket 模式；
:::

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

### udpRelay

- 类型：`boolean`
- 默认值：`false`

你可以通过配置这个属性来强制设定节点的 UDP 转发支持情况。

## Shadowsocks JSON 订阅

```js
module.exports = {
  type: 'shadowsocks_json_subscribe',
  url: '',
  udpRelay: true,
}
```

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

若机场没有提供这种订阅地址，推荐使用 Fndroid 的 [接口](https://github.com/Fndroid/jsbox_script/wiki/%E5%BC%80%E6%94%BE%E6%8E%A5%E5%8F%A3%E4%BD%BF%E7%94%A8%E5%8F%8A%E8%AF%B4%E6%98%8E#surge%E6%89%98%E7%AE%A1%E8%BD%AC%E6%8D%A2shadowsockswindows%E9%85%8D%E7%BD%AE) 进行转换。

:::warning 注意
- 如果你正在使用 [DlerCloud](https://dlercloud.com/auth/register?affid=45071)，可以使用 Surge 的托管订阅地址，然后使用 `surge2sswin` 转换
:::

### udpRelay

- 类型：`boolean`
- 默认值：`false`

由于这种订阅协议不支持定义 UDP 转发的支持情况，所以单独出来进行配置。UDP 转发可以应用在 Surge 中。

## Shadowsocks 订阅

```js
module.exports = {
  type: 'shadowsocks_subscribe',
  url: '',
  udpRelay: true,
}
```

:::warning 注意
1. Surgio 支持读取 `obfs-local` 和 `v2ray-plugin` 两种 SIP003 插件配置；
2. 仅支持 `v2ray-plugin` 的 WebSocket 模式；
:::

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

:::warning 注意
- 如果你正在使用 [DlerCloud](https://dlercloud.com/auth/register?affid=45071)，可以使用 SS 订阅地址
:::

### udpRelay

- 类型：`boolean`
- 默认值：`false`

由于这种订阅协议不支持定义 UDP 转发的支持情况，所以单独出来进行配置。UDP 转发可以应用在 Surge 中。

## Shadowsocksr 订阅

```js
module.exports = {
  type: 'shadowsocksr_subscribe',
  url: '',
}
```

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

## V2rayn 订阅

```js
module.exports = {
  type: 'v2rayn_subscribe',
  url: '',
}
```

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

:::warning 注意
- Quantumult 的订阅格式和 V2rayN 的订阅格式有差异，不可以混用；
- 如果你正在使用 [DlerCloud](https://dlercloud.com/auth/register?affid=45071)，可以使用「通用」类型的订阅地址；
- 订阅中的 V2Ray 和 Shadowsocks 节点会被读取；
:::

### compatibleMode

- 类型：`boolean`
- 默认值：`false`

部分机场提供的订阅地址不符合标准，提供一个兼容模式进行解析。

### udpRelay

- 类型：`boolean`
- 默认值：`false`

由于这种订阅协议不支持定义 UDP 转发的支持情况，所以单独出来进行配置。

### skipCertVerify

- 类型：`boolean`
- 默认值：`false`

由于这种订阅协议不支持定义跳过证书验证，所以单独出来进行配置。

### tls13

- 类型：`boolean`
- 默认值：`false`

强制开启节点的 TLS 1.3。

## Trojan 订阅

```js
module.exports = {
  type: 'trojan',
  url: '',
}
```

:::warning 注意
该订阅方式仅支持标准的 Trojan 协议，不支持 WebSocket 和 GRPC
:::

### url

- 类型：`string`
- <Badge text="必须" vertical="middle" />

### udpRelay

- 类型：`boolean`
- 默认值：`false`

强制开启节点的 UDP 转发。

### tls13

- 类型：`boolean`
- 默认值：`false`

强制开启节点的 TLS 1.3。

## nodeConfig 公共属性

:::tip 提示
- 公共属性可以定义在任何一种 Provider 中；
- 请务必注意下面 `nodeConfig` 指的是 `custom` 类型内的每个节点，`provider` 指的是 Provider；
:::

### nodeConfig.enable

- 类型：`boolean`
- 默认值：`true`

单独关闭某个节点输出到配置中。若没有 `enable` 属性则默认打开。

```
{
  enable: false,
  type: 'shadowsocks',
  nodeName: '🇺🇸US',
  hostname: 'us.example.com',
  port: 10000,
  method: 'chacha20-ietf-poly1305',
  password: 'password',
}
```

### nodeConfig.tfo

- 类型：`boolean`
- 默认值：`false`

是否为该节点开启 TFO（TCP Fast Open）。

### nodeConfig.mptcp

- 类型：`boolean`
- 默认值：`false`

是否为该节点开启 Multipath TCP。目前仅 Surge 支持这一特性。

### nodeConfig.shadowTls

- 类型：`object`
- 默认值：`undefined`

目前仅 Surge 和 Stash 支持这一特性。

### nodeConfig.shadowTls.password

- 类型：`string`
- <Badge text="必须" vertical="middle" />

### nodeConfig.shadowTls.sni

- 类型：`string`
- <Badge text="必须" vertical="middle" />

### nodeConfig.shadowTls.version

- 类型：`number`
- 默认值：`undefined`

### nodeConfig.tls13

- 类型：`boolean`
- 默认值：`false`

为 TLS 节点开启 TLS 1.3 支持。

:::warning 注意
1. TLS 1.3 需要服务端支持；
2. 支持 TLS 的节点类型有 Shadowsocks with v2ray-plugin(tls), Vmess(tls), HTTPS, AnyTLS；
:::

### nodeConfig.skipCertVerify

- 类型：`boolean`
- 默认值：`false`

关闭 TLS 节点的证书检查。

:::warning 注意
1. 支持 TLS 的节点类型有 Shadowsocks with v2ray-plugin(tls), Vmess(tls), HTTPS, AnyTLS；
2. 请不要随意将证书检查关闭；
:::

### nodeConfig.portHopping

- 类型：`string`
- 默认值：`undefined`

开启 Tuic 和 Hysteria 协议端口跳跃，目前仅 Surge, Sing-box, Stash 和 Mihomo 支持这一特性。例如 `5000,6000-7000`。该配置支持逗号或分号分割的端口列表，以及连字符分割的端口范围，Surgio 会自动转换成 Surge 和 Stash 支持的格式。Sing-box 的 Hysteria 协议也支持端口跳跃，但仅支持 `6000-7000` 这样连字符分割的端口范围，单个端口的配置会被忽略。

### nodeConfig.portHoppingInterval

- 类型：`number`
- 默认值：`undefined`

端口跳跃的间隔时间，单位为秒。目前仅 Surge, Stash 和 Mihomo 支持这一特性。

### nodeConfig.underlyingProxy

- 类型：`string`
- 默认值：`undefined`

可以通过一个代理跳板使用另一个代理，可以无限嵌套使用。目前仅 Surge 支持该特性。

:::warning 注意
Surgio 不会验证名称是否有效
:::

### nodeConfig.testUrl

- 类型：`string`
- 默认值：`undefined`

在新版的 Surge 中支持针对某个 Proxy 设置测试的地址。你可以通过这个参数来设置改地址。

:::warning 注意
1. Surgio 不会验证名称是否有效；
2. 目前仅 Surge 支持该特性；
:::

### nodeConfig.serverCertFingerprintSha256

- 类型：`string`
- 默认值：`undefined`

用于验证服务器证书的 SHA256 指纹。目前仅 Surge 支持该特性。

### nodeConfig.ecn

- 类型：`boolean`
- 默认值：`false`

是否为该节点开启 [ECN（Explicit Congestion Notification）](https://yach.me/2023/10/14/ccn-and-ecn/)。目前仅 Surge 支持这一特性。

### nodeConfig.blockQuic

- 类型：`string`
- 默认值：`undefined`

通过代理转发 QUIC 流量可能会导致性能问题。启用该选项将阻止 QUIC 流量，使客户端退回到传统的 HTTPS/TCP 协议。目前仅 Surge 支持这一特性。

`auto`: 根据代理是否适合转发 QUIC 流量自动启用
`on`: 强制阻止 QUIC 流量
`off`: 不阻止 QUIC 流量

### nodeConfig.multiplex

> <Badge text="v3.7.0" vertical="middle" />

:::warning 注意
1. 当前仅支持输出 sing-box 的多路复用配置
2. 仅基于 TCP 的协议支持多路复用
:::

- sing-box 的多路复用说明：[链接](https://sing-box.sagernet.org/configuration/shared/multiplex/)
- Clash Meta (mihomo) 的多路复用说明：[链接](https://wiki.metacubex.one/config/proxies/sing-mux/)

```json5
{
  multiplex: {
    protocol: '', // smux, yamux, h2mux
    maxConnections: 1, // 最大连接数量，与 max_streams 冲突
    minStreams: 1, // 在打开新连接之前，连接中的最小多路复用流数量，与 max_streams 冲突
    maxStreams: 1, // 在打开新连接之前，连接中的最大多路复用流数量，与 max_connections 和 min_streams 冲突
    padding: false, // 启用填充
    brutal: { // 可选，TCP Brutal 拥塞控制算法
      upMbps: 0, // 上行 Mbps
      downMbps: 0, // 下行 Mbps
    },
  }
}
```

### 客户端特殊配置

> <Badge text="v3.2.0" vertical="middle" />

- `nodeConfig.clashConfig`
- `nodeConfig.surgeConfig`
- `nodeConfig.quantumultXConfig`
- `nodeConfig.surfboardConfig`

你可以单独为某一个节点配置单独更改客户端的配置，Surgio 会将这些配置合并到最终的配置中。

比如 Hysteria 配置的密码字段默认是 `password` 但是 Stash 使用的是 `auth` 字段，你可以借助订阅请求的 UserAgent 动态地修改 `nodeConfig.clashConfig.clashCore` 这个字段，返回不同的订阅。

## Provider 公共属性

### provider.nodeFilter

- 类型：`Function`
- 入参：`NodeConfig`
- 返回值：`boolean`

有一些俗称「外贸机场」的服务商提供很多诸如马来西亚、土耳其的节点，不需要这些国家节点的朋友每次都要在数十个节点中寻找自己想要的。我们可以用这个方法把这些节点过滤掉。

```js
const { utils } = require('surgio')

module.exports = {
  // 过滤出名字中包含土耳其和马来西亚的节点
  nodeFilter: utils.useKeywords(['土耳其', '马来西亚']),
}
```

:::tip 提示
关于过滤器的自定义和其它进阶使用方法，请阅读 [「自定义过滤器」](/guide/advance/custom-filter.md)。
:::

### provider.netflixFilter

- 类型：`Function`
- 入参：`NodeConfig`
- 返回值：`boolean`

该方法会覆盖 Surgio 内置的 `netflixFilter`。用于过滤出支持 Netflix 的节点。对于那些每一个节点都解锁流媒体的机场，也可以单独过滤出部分你喜欢的节点。

[内置 `netflixFilter` 的解释](/guide/custom-template.md#netflixfilter)。

```js
module.exports = {
  // 过滤出名字中包含 HK（大小写不敏感）的节点
  netflixFilter: utils.useKeywords(['hk', 'HK']),
}
```

### provider.youtubePremiumFilter

- 类型：`Function`
- 入参：`NodeConfig`
- 返回值：`boolean`

该方法会覆盖 Surgio 内置的 `youtubePremiumFilter`。用于过滤出支持 Youtube Premium 的节点。

[内置 `youtubePremiumFilter` 的解释](/guide/custom-template.md#youtubepremiumfilter)。

### provider.customFilters

- 类型：`object`
- 默认值：`undefined`

自定义 Filter。关于自定义 Filter 的用法，请阅读 [进阶 - 自定义 Filter](/guide/advance/custom-filter)。

:::tip 提示
你现在可以定义 [全局的过滤器](/guide/custom-config.md#customfilters) 了！
:::

### provider.startPort

- 类型：`number`

在调用 `getSurgeNodes` 时会强制要求设置该值。建议大于 10000。

在生成 Surge 的 Shadowsocksr 和 Vmess 配置文件时，本地监听端口会根据此配置递增。这样做的好处是切换配置文件时不会遇到端口冲突。同一个 Provider 被用在不同的 Artifact 中也会进行递增。

### provider.addFlag

- 类型：`boolean`
- 默认值：`false`

在节点名称前加国旗 Emoji。需要注意的是，Surgio 是根据有限的节点名关键词判断位置的，如果无法匹配则会保留原节点名。你可以在所有的过滤器中检索国旗 Emoji。

### provider.removeExistingFlag

- 类型：`boolean`
- 默认值：`false`

去除订阅中的国旗 Emoji。可以在不开启 `addFlag` 时使用，这时会输出没有 Emoji 的节点名称。

### provider.tfo

- 类型：`boolean`
- 默认值：`false`

是否为该订阅强制开启 TFO（TCP Fast Open）。部分机场虽然支持 TFO 但是没有在订阅中开启，你可以通过这个配置强制打开。

### provider.underlyingProxy

- 类型：`string`
- 默认值：`undefined`

是否对当前 Provider 中所有节点使用自定义 Underlying Proxy。在 `CustomProvider` 中也可以使用，但是优先级低于 `nodeConfig.underlyingProxy`。

目前仅 [Surge](https://manual.nssurge.com/policy/proxy.html) 和 [Clash Meta](https://wiki.metacubex.one/config/proxies/dialer-proxy/?h=dialer#dialer-proxy) 支持该特性。

:::warning 注意
Surgio 不会验证名称是否有效
:::

### provider.mptcp

- 类型：`boolean`
- 默认值：`false`

是否为该订阅强制开启 Multipath TCP。目前仅 Surge 支持这一特性。

### provider.ecn

- 类型：`boolean`
- 默认值：`false`

是否为该订阅强制开启 ECN（Explicit Congestion Notification）。目前仅 Surge 支持这一特性。

### provider.blockQuic

- 类型：`string`
- 默认值：`undefined`

是否为该订阅强制阻止 QUIC 流量。目前仅 Surge 支持这一特性。

`auto`: 根据代理是否适合转发 QUIC 流量自动启用
`on`: 强制阻止 QUIC 流量
`off`: 不阻止 QUIC 流量

### provider.renameNode

- 类型：`Function`
- 默认值：`undefined`

更改节点名。如果你对机场的奇葩命名有意见，可以在这里把他们替换掉。

```js
module.exports = {
  renameNode: (name) => {
    if (name === '社会主义') {
      return '资本主义'
    }
    return name
  },
}
```

:::warning 注意
1. `nodeFilter` 只对原始名称有效；
2. 其它内置过滤器和自定义过滤器仅对新名称有效；
3. 如果你开启了 `addFlag`，那国家地区判定仅对新名称有效；
4. 这个方法不一定要在末尾 `return` 内容，如果没有返回内容则保留原名称；
:::

### provider.relayUrl

- 类型：`Boolean|String`
- 默认值：`undefined`

开启订阅地址转发。由于部分机场禁止 AWS 等公有云服务器访问，所以面板无法获取订阅内容。开启后会使用一个免费并且安全的转发服务进行获取。

从 v2.4.0 开始，你可以指定一个字符串来自定义转发服务。设置的方法如下：

1. URL 中插入原始的订阅连接：

```js
module.exports = {
  relayUrl: 'https://proxy.example.com/%URL%',
}
```

2. URL 中插入 URL encoded 后的订阅连接：

```js
module.exports = {
  relayUrl: 'https://proxy.example.com/?url=%%URL%%',
}
```

如果 `relayUrl` 是一个布尔值，则使用内置的服务进行转发。

### provider.requestUserAgent

- 类型：`string`
- 默认值：undefined

指定订阅请求头中的 User-Agent 字段。若不指定则使用内置的默认值 `surgio/<版本号>`。

## 钩子函数 (hooks)

钩子函数是 Surgio v3 新增的特性，用于在获取远程订阅内容时执行一些操作。你可以在所有类型的 Provider 中定义钩子函数。所有的钩子函数都会在 `renameNode`, `addFlag`, `removeExistingFlag`, `nodeFilter` 等原有用来修改节点的方法之前执行。

### hooks.afterNodeListResponse

`async afterNodeListResponse(nodeList: NodeConfig[], customParams: {}): Promise<NodeConfig[]>`

该钩子函数会在成功获取到远程订阅内容后执行。你可以自由修改节点的内容，甚至是像维护自定义类型 Provider 那样追加自己的节点。

这个方法要求最后需要返回一个 `NodeConfig[]`，否则你的操作可能不会生效。

`customParams` 是一个对象，包含了所有在 Artifact 和全局定义的自定义参数。假如你使用了 Gateway，则里面还包含所有请求 URL 中的参数和 `requestUserAgent`，方便你根据不同的客户端返回不同的节点列表。

```ts
const { defineClashProvider } = require('surgio')

module.exports = defineClashProvider({
  url: 'https://example.com/clash.yaml',
  hooks: {
    afterNodeListResponse: async (nodeList, customParams) => {
      // nodeList: NodeConfig[]
      // customerParams: {}
      return nodeList
    },
  },
})
```

### hooks.onError

`async onError(error: Error): Promise<NodeConfig[] | undefined>`

该钩子函数会在获取远程订阅内容失败时执行。你可以在这里进行错误处理，或者返回一个 `NodeConfig[]` 以继续执行，格式类似 `CustomProvider` 里的节点列表。

```ts
const { defineClashProvider } = require('surgio');

module.exports = defineClashProvider({
  url: 'https://example.com/clash.yaml',
  hooks: {
    onError: async error => {
      // error: Error
      return [
        {
          nodeName: 'Fallback',
          type: 'shadowsocks',
          hostname: 'fallback.example.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'password',
        },
      ];
    },
  },
})
```
