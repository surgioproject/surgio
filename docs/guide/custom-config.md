---
sidebarDepth: 1
---

# 配置文件

Surgio 的配置文件位于目录内的 `surgio.conf.js`。

Surgio 内置了 `defineSurgioConfig` 方法，可以让 IDE 智能提示配置项，不过你也可以不使用这样的语法糖。下面两种写法都是可以的。

```js
const { defineSurgioConfig } = require('surgio');

module.exports = defineSurgioConfig({
  artifacts: [],
  urlBase: 'https://example.com/',
  upload: {},
  binPath: {},
});
```

```js
module.exports = {
  artifacts: [],
  urlBase: 'https://example.com/',
  upload: {},
  binPath: {},
};
```

## artifacts

- 类型：`Artifact[]`
- 默认值：`undefined`
- <Badge text="必须" vertical="middle" />

数组内容见 [自定义 Artifact](/guide/custom-artifact.md)。

## urlBase

- 类型：`string`
- 默认值：`/`

规则文件的下载地址前缀。

:::warning 注意
以 `/` 结尾，如：`https://example.com/` 。
:::


## remoteSnippets

- 类型：`RemoteSnippet[]`
- 默认值：`undefined`

:::tip 提示
这个功能和 Surge 本身的 `RULE-SET` 功能无关，所以生成出来的规则可以在老版本的 Surge 和其它客户端中使用。
:::

远程片段。你可以在这里配置符合 [Surge Ruleset 标准](https://nssurge.zendesk.com/hc/zh-cn/articles/360010038714-Surge-Mac-3-Release-Note) 的文件，然后在模板中使用它们。

```js
module.exports = {
  remoteSnippets: [
    {
      url: 'https://github.com/Blankwonder/surge-list/raw/master/cn.list',
      name: 'cn', // 模板中对应 remoteSnippets.cn
    },
  ],
};
```

**推荐的 RuleSet 列表：**

- [ConnersHua/Profiles](https://github.com/ConnersHua/Profiles/tree/master/Surge/Ruleset)
- [Blankwonder/surge-list](https://github.com/Blankwonder/surge-list/)
- [Hackl0us/SS-Rule-Snippet](https://github.com/Hackl0us/SS-Rule-Snippet/tree/master/Rulesets)
- [lhie1/Rules](https://github.com/lhie1/Rules/tree/master/Surge3)

从 v2.7.0 开始，你可以在这里配置符合 [Surgio 片段](/guide/custom-template.md#片段-snippet) 格式的文件。我们以 Surgio 推荐的 [苹果服务规则](https://github.com/geekdada/surge-list/blob/master/surgio-snippet/apple.tpl) 为例。

```js{6}
module.exports = {
  remoteSnippets: [
    {
      url: 'https://raw.githubusercontent.com/geekdada/surge-list/master/surgio-snippet/apple.tpl',
      name: 'apple', // 模板中对应 remoteSnippets.apple
      surgioSnippet: true
    },
  ],
};
```

使用：

```html
{{ remoteSnippets.apple.main('🚀 Proxy', '🍎 Apple', '🍎 Apple CDN', 'DIRECT', '🚀 Proxy') }}
```

:::warning 注意
片段中宏的入参需要和 `main` 方法调用时的入参 **一一对应**，一个都不能少。
:::

## upload

- 类型：`object`
- 默认值：`undefined`

上传阿里云 OSS 的配置。

:::warning 注意
- 若删除了某个 Artifact，该规则文件会从 OSS 中删除
- 每次上传都会覆盖原有的文件，所以请不要更改 OSS 中的文件
- 请不要通过 CDN 访问 OSS 内的文件，这样会导致更新不即时且很难删除
:::

### upload.prefix

- 类型：`string`
- 默认值：`/`

默认保存至根目录，可以修改子目录名，以 / 结尾

### upload.bucket

- 类型：`string`
- 默认值：`undefined`
- <Badge text="必须" vertical="middle" />

### upload.region

- 类型：`string`
- 默认值：`oss-cn-hangzhou`

### upload.accessKeyId

- 类型：`string`
- 默认值：`undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
请不要将该字段上传至公共仓库。
:::

### upload.accessKeySecret

- 类型：`string`
- 默认值：`undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
请不要将该字段上传至公共仓库。
:::

## binPath

如果需要生成针对 Surge 的 SSR 订阅，需要额外配置此项。

### binPath.shadowsocksr

- 类型：`string`
- 默认值：`undefined`

SSR 的可执行文件地址。请使用 libev 版本的二进制文件，可以在 [这篇文章](/guide/advance/surge-advance.md) 找到下载地址和使用方法。

## surgeConfig

- 类型：`object`
- 默认值：`undefined`

```js
// surgio.conf.js
module.exports = {
  surgeConfig: {},
};
```

### surgeConfig.resolveHostname

- 类型：`boolean`
- 默认值：`false`

如果你已经开启了全局的 `resolveHostname`，可以不开启此项。

为了不让代理进程（如 ssr-local）的流量经过 Surge 的 TUN 模块，需要额外指定 `addresses` 参数。在之前版本的 Surgio 里，生成的配置不会对域名进行解析，导致实际使用中仍然会造成额外的性能损耗。

打开这个选项后，Surgio 会在生成配置的时候解析域名。不过，这必然会造成生成时间延长，所以请按照个人的需要进行选择。

### surgeConfig.vmessAEAD

- 类型：`boolean`
- 默认值：`true`

默认开启 Vmess AEAD 加密，如果您的服务器不支持 AEAD 加密，请关闭。

## quantumultXConfig

- 类型：`object`
- 默认值：`undefined`

```js
// surgio.conf.js
module.exports = {
  quantumultXConfig: {},
};
```

### quantumultXConfig.vmessAEAD

- 类型：`boolean`
- 默认值：`true`

默认开启 Vmess AEAD 加密，如果您的服务器不支持 AEAD 加密，请关闭。

## clashConfig

- 类型：`object`
- 默认值：`undefined`

```js
// surgio.conf.js
module.exports = {
  clashConfig: {
    enableTuic: false,
  },
};
```

### clashConfig.enableTuic

- 类型：`boolean`
- 默认值：`false`

目前仅 Clash Meta 内核和 Stash 支持 Tuic，如果你希望在 Clash 订阅中输出 Tuic 节点请开启此项。

### clashConfig.enableShadowTls

> <Badge text="v3.0.0" vertical="middle" />

- 类型：`boolean`
- 默认值：`false`

目前仅 Stash 支持 shadow-tls，如果你希望在 Shadowsocks 节点中使用 shadow-tls 请开启此项。

### clashConfig.enableHysteria2

> <Badge text="v3.1.0" vertical="middle" />

- 类型：`boolean`
- 默认值：`false`

目前仅 Clash Meta 内核和 Stash 支持 Hysteria v2，如果你希望在 Clash 订阅中输出 Hysteria v2 节点请开启此项。

### clashConfig.enableVless

> <Badge text="v3.6.0" vertical="middle" />

- 类型：`boolean`
- 默认值：`false`

目前仅 Clash Meta 内核和 Stash 支持 VLESS，如果你希望在 Clash 订阅中输出 VLESS 节点请开启此项。

### clashConfig.clashCore

> <Badge text="v3.2.0" vertical="middle" />

- 类型：`string`
- 默认值：`clash`
- 可选值：`clash`, `clash.meta`, `stash`

Clash 核心版本。默认使用 Clash 核心，如果你希望输出针对 Clash Meta 内核或 Stash 的配置请修改此项。

下面是目前支持的变化：

| 核心 | 变化                                                           |
| --- |--------------------------------------------------------------|
| `clash` | 默认值                                                          |
| `clash.meta` | 模板 `clash` 过滤器会改为过滤 Clash Meta 不支持的规则                        |
| `stash` | - Hysteria 协议的密码字段改为 `auth`；模板 `clash` 过滤器会改为过滤 Stash 不支持的规则 |

:::warning 注意
`enableTuic`, `enableShadowTls`, `enableHysteria2`, `enableVless` 这几个配置项和 `clashCore` 目前互不影响，但是将来会合并到 `clashCore` 中。
:::

## surfboardConfig

- 类型：`object`
- 默认值：`undefined`

```js
// surgio.conf.js
module.exports = {
  surfboardConfig: {},
};
```

### surfboardConfig.vmessAEAD

- 类型：`boolean`
- 默认值：`true`

默认开启 Vmess AEAD 加密，如果您的服务器不支持 AEAD 加密，请关闭。

## gateway

- 类型：`object`
- 默认值：`undefined`

```js
// surgio.conf.js
module.exports = {
  gateway: {},
};
```

托管 API 相关配置

### gateway.auth

- 类型：`boolean`
- 默认值：`false`

是否开启鉴权，默认关闭。若开启则需要在访问 URL 上增加参数 `access_token`。

### gateway.accessToken

- 类型：`string`
- 默认值：`undefined`

用于调用接口和登录的鉴权码。

### gateway.viewerToken

- 类型：`string`
- 默认值：`undefined`

专门用于调用以下接口的鉴权码：

- `/get-artifact`
- `/export-providers`
- `/render`

### gateway.useCacheOnError

- 类型：`boolean`
- 默认值：`false`

是否在 Artifact 生成错误时使用缓存（上一次正确请求的结果）。

如果 Artifact 中的某个 Provider 经常请求错误则建议开启这个选项，可以避免 Clash 等客户端在配置文件请求报错的时候崩溃。

:::warning 注意
1. 应用重启后缓存会失效。
2. 适用缓存的接口有 `/get-artifact` 和 `/export-providers`。
:::

### gateway.passRequestUserAgent

> <Badge text="Gateway: v2.0.0" vertical="middle" /><br />
> <Badge text="Surgio v3.0.0" vertical="middle" />

- 类型：`boolean`
- 默认值：`false`

是否将 `/get-artifact` 请求中的 `User-Agent` 传递给上游机场的订阅服务器。这个选项主要用于解决某些机场的订阅服务器对 `User-Agent` 有特殊处理的问题。

### gateway.passRequestHeaders

> <Badge text="Gateway: v2.3.0" vertical="middle" /><br />
> <Badge text="Surgio v3.12.0" vertical="middle" />

- 类型：`string[]`
- 默认值：`['x-surge-unlocked-features']`

允许转发到上游订阅服务器的请求头白名单。配置后会从 `/get-artifact` 请求中选取对应的 Header 透传给订阅地址（Header 名称会统一转为小写）。

```js
// surgio.conf.js
module.exports = {
  gateway: {
    passRequestHeaders: ["x-custom"], // 不会覆盖内部默认值
  },
};
```

:::tip 提示
`passRequestUserAgent` 为 `true` 时会自动包含 `user-agent`，无需重复配置。
:::

## customFilters

- 类型：`object`
- 默认值：`undefined`

全局自定义 Filter。关于自定义 Filter 的用法，请阅读 [进阶 - 自定义 Filter](/guide/advance/custom-filter)。

:::warning 注意
全局的过滤器优先级没有 Provider 中定义的过滤器高，如果遇到同名的过滤器则这里定义的值会被覆盖。
:::

## proxyTestUrl

- 类型：`string`
- 默认值：`http://cp.cloudflare.com/generate_204`

模板中可以直接引用 `{{ proxyTestUrl }}` 来获取推荐的代理测试 URL。

## proxyTestInterval

- 类型：`number`
- 默认值：`1200`

模板中可以直接引用 `{{ proxyTestInterval }}` 来获取推荐的测试间隔。

## internetTestUrl

- 类型：`string`
- 默认值：`http://connect.rom.miui.com/generate_204`

模板中可以直接引用 `{{ internetTestUrl }}` 来获取推荐的联网测试 URL（检测设备是否联网而非梯子是否可用）。

## internetTestInterval

- 类型：`number`
- 默认值：`1200`

模板中可以直接引用 `{{ internetTestInterval }}` 来获取推荐的测试间隔。

## customParams

- 类型：`object`
- 默认值：`{}`

自定义的 **全局** 模板变量。可以在模板中获取，方便定制化模板。

:::tip 提示
1. 全局模板变量的用法和 Artifact 中定义的模板变量相同，相关文档请查阅 [这里](/guide/custom-artifact.md#customparams)；
2. 在合并全局、局部模板变量和面板 URL 参数时的优先级为：URL 参数 > 局部 > 全局；
:::

## checkHostname

- 类型：`boolean`
- 默认值：`false`

是否丢弃无法解析出域名 IP 地址的节点。无法解析出域名的节点有可能会导致 Clash 的 `url-test` 模式抛出异常而中止，丢弃这些节点可以避免这个问题。

某些机场的节点域名 TTL 非常小，在某些情况下可能会导致 DNS 回溯解析超时，这样会导致节点本身可用但是被抛弃，所以建议谨慎开启该选项。

## resolveHostname

- 类型：`boolean`
- 默认值：`false`

是否解析节点的域名。开启此功能后 Surgio 会将节点的域名解析为 IP 地址，这样可能可以加速节点的连接速度。请注意，这个选项和 `surgeConfig.resolveHostname` 不同，前者是全局配置，后者供生成 Surge 使用的 SSR 配置。假如你已经打开了 `surgeConfig.resolveHostname`，那开启 `resolveHostname` 后可以删除 `surgeConfig.resolveHostname`

打开这个选项后，Surgio 会在生成配置的时候解析域名，这必然会造成生成时间延长，所以请按照个人的需要进行选择。另外，开启此选项后将失去节点的负载均衡功能（如有）和 DNS 解析的灵活性，所以请**谨慎使用**。

部分依赖 SNI 的节点假如你未手动设定 SNI，开启此功能后可能会导致节点无法连接。

## flags

- 类型：`object`
- 默认值：`undefined`

自定义国旗的添加规则。

Surgio 支持字符串和正则表达式的匹配方式，可以 emoji 和规则一对一，也可以一对多。这里的规则会合并到内置的规则中，同名（相同 emoji）的规则会被覆盖。

```js
module.exports = {
  // ...
  flags: {
    '🇪🇬': '埃及',
    '🇮🇹': ['意大利', 'ITALY'],
    '🇱🇰': ['斯里兰卡', /sri\slanka/i],
  },
};
```

:::tip 提示
1. 字符串的匹配方式是「包含」；
2. 英文字母请使用大写；
:::

## cache

- 类型：`object`
- 默认值：`undefined`

定义缓存的实现方式。默认情况下使用本地缓存文件和内存的方式存储。如果你使用了 API 网关，非常推荐开启 Redis 缓存，可以有效降低冷启动的时间。

### cache.type

- 类型：`string`
- 默认值：`default`
- 可选值：`default`, `redis`

定义：
- `default`：使用本地缓存文件和内存的方式存储
- `redis`: 使用 Redis 的方式存储

### cache.redisUrl

- 类型：`string`
- 默认值：`undefined`

假如 `cache.type` 为 `redis`，则需要指定 Redis 的连接地址。这个属性支持的格式有：

- `redis://xxx`
- `rediss://xxx` (TLS)

## 环境变量

Surgio 支持使用 [环境变量](/guide/env.md) 来调整没有公开的配置，但属于高级用法，请酌情使用。
