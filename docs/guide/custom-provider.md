---
title: Provider (服务提供者)
sidebarDepth: 2
---

# Provider (服务提供者)

你可以在 `provider` 目录内看到两个已经写好的 Provider，它们分别是订阅地址和自己维护的节点列表。

需要注意的是文件名即为该 Provider 的名称，后面在定义 Artifact 时会用到。

目前 Surgio 支持两种 Provider 类型：

|  类型  |  描述  |  备注  |
|:---:| --- | --- |
|  `shadowsocks_json_subscribe`  |  Windows 客户端的订阅地址  |    |
|  `v2rayn_subscribe`  |  V2rayN 订阅地址  |  [协议](https://github.com/2dust/v2rayN/wiki/%E8%AE%A2%E9%98%85%E5%8A%9F%E8%83%BD%E8%AF%B4%E6%98%8E)  |
|  `custom`  |  自己维护的节点  |  支持 Shadowsocks, Shadowsocksr, Snell, HTTPS  |

## shadowsocks_json_subscribe

```js
module.exports = {
  type: 'shadowsocks_json_subscribe',
  url: '',
  udpRelay: true,
};
```

### url

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

若机场没有提供这种订阅地址，推荐使用 Fndroid 的 [接口](https://github.com/Fndroid/jsbox_script/wiki/%E5%BC%80%E6%94%BE%E6%8E%A5%E5%8F%A3%E4%BD%BF%E7%94%A8%E5%8F%8A%E8%AF%B4%E6%98%8E#surge%E6%89%98%E7%AE%A1%E8%BD%AC%E6%8D%A2shadowsockswindows%E9%85%8D%E7%BD%AE) 进行转换。

:::warning 注意
- 如果你正在使用 [DlerCloud](https://dlercloud.com/auth/register?affid=45071)，可以使用 Surge 的托管订阅地址，然后使用 `surge2sswin` 转换
:::

### udpRelay

- 类型: `boolean`
- 默认值: `false`

由于这种订阅协议不支持定义 UDP 转发的支持情况，所以单独出来进行配置。UDP 转发可以应用在 Surge 中。

## v2rayn_subscribe

```js
module.exports = {
  type: 'v2rayn_subscribe',
  url: '',
};
```

### url

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
- Quantumult 的订阅格式和 V2rayN 的订阅格式有差异，不可以混用
- 如果你正在使用 [DlerCloud](https://dlercloud.com/auth/register?affid=45071)，可以使用「通用」类型的订阅地址
:::


## custom

```js
module.exports = {
  type: 'custom',
  nodeList: [],
};
```

### nodeList

- 类型: `NodeConfig[]`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

不同的类型的节点 `NodeConfig` 结构有一些不同，下面是所有支持的节点类型：

*Shadowsocks*

```js
{
  type: 'shadowsocks',
  nodeName: '🇺🇸US',
  hostname: 'us.example.com',
  port: 10000,
  method: 'chacha20-ietf-poly1305',
  password: 'password',
  obfs: 'tls', // tls 或 http
  'obfs-host': 'gateway-carry.icloud.com',
  'udp-relay': 'true',
}
```

*Shadowsocksr*

```js
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
}
```

*Vmess*

```js
{
  nodeName: '🇭🇰HK',
  type: 'vmess',
  hostname: 'hk.example.com',
  method: 'auto', // 仅支持 auto/aes-128-gcm/chacha20-ietf-poly1305/none
  network: 'ws', // 仅支持 tcp/ws
  alterId: '64',
  path: '/',
  port: 8080,
  tls: false,
  host: 'example.com',
  uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
}
```

*Snell*

```js
{
  type: 'snell',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 10000,
  psk: 'RjEJRhNPps3DrYBcEQrcMe3q9NzFLMP',
  obfs: 'tls', // tls 或 http
}
```

*HTTPS*

```js
{
  type: 'https',
  nodeName: '🇭🇰HK',
  hostname: 'hk.example.com',
  port: 443,
  username: 'username',
  password: 'password',
}
```

## 公共属性

:::tip
公共属性可以定义在任何一种 Provider 中。
:::

### nodeConfig.enable

- 类型: `boolean`
- 默认值: `true`

单独关闭某个节点输出到配置中。若没有 `enable` 属性则默认打开。

```js
{
  enable: false,
  type: 'shadowsocks',
  nodeName: '🇺🇸US',
  hostname: 'us.example.com',
  port: '10000',
  method: 'chacha20-ietf-poly1305',
  password: 'password',
}
```

### provider.nodeFilter

- 类型: `Function`
- 入参: `NodeConfig`
- 返回值: `boolean`

有一些俗称「外贸机场」的服务商提供很多诸如马来西亚、土耳其的节点，不需要这些国家节点的朋友每次都要在数十个节点中寻找自己想要的。我们可以用这个方法把这些节点过滤掉。

```js
module.exports = {
  // 过滤出名字中包含土耳其和马来西亚的节点
  nodeFilter(nodeConfig) {
    return [
      /(土耳其|马来西亚)/,
    ].some(regex => regex.test(nodeConfig.nodeName));
  },
};
```

### provider.netflixFilter

- 类型: `Function`
- 入参: `NodeConfig`
- 返回值: `boolean`

该方法会覆盖 Surgio 内置的 `netflixFilter`。用于过滤出支持 Netflix 的节点。对于那些每一个节点都解锁流媒体的机场，也可以单独过滤出部分你喜欢的节点。

[内置 `netflixFilter` 的解释](/guide/custom-template.md#netflixfilter)。

```js
module.exports = {
  // 过滤出名字中包含 HK（大小写不敏感）的节点
  netflixFilter(nodeConfig) {
    const name = nodeConfig.nodeName.toLowerCase();
    return [
      'hk',
    ].some(key => name.includes(key));
  },
};
```

### provider.youtubePremiumFilter

该方法会覆盖 Surgio 内置的 `youtubePremiumFilter`。用于过滤出支持 Youtube Premium 的节点。

[内置 `youtubePremiumFilter` 的解释](/guide/custom-template.md#youtubepremiumfilter)。
