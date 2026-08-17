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
});
```

```js
module.exports = {
  artifacts: [],
  urlBase: 'https://example.com/',
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

上传到对象存储的配置。支持阿里云 OSS、Cloudflare R2 和其它 S3 兼容服务。

:::warning 注意
- 若删除了某个 Artifact，该规则文件会从对象存储中删除
- 每次上传都会覆盖原有的文件，所以请不要更改对象存储中的文件
- 上传命令会同步 `prefix` 下的直接子对象，请不要在同一前缀中放置其它文件
:::

访问凭证可以写入配置，也可以通过环境变量
`S3_BACKEND_ACCESS_KEY_ID` 和 `S3_BACKEND_ACCESS_KEY_SECRET` 提供。环境变量优先。

### 阿里云 OSS

省略 `backend` 时默认使用 OSS。推荐使用通用 Region ID，例如 `cn-hangzhou`、
`ap-southeast-1` 或 `eu-central-1`。旧格式 `oss-cn-hangzhou` 仍然可用。

```js
module.exports = {
  upload: {
    backend: 'oss',
    bucket: 'example-bucket',
    region: 'cn-hangzhou',
    endpointType: 'public',
    prefix: '/',
  },
};
```

`endpointType` 支持以下值：

- `public`：公网 S3 兼容 Endpoint，默认值
- `internal`：同 Region 阿里云内网 Endpoint
- `accelerate`：传输加速 Endpoint，使用前需要为 Bucket 开启传输加速

也可以通过 `endpoint` 覆盖自动生成的地址。该字段只接受服务级 OSS Endpoint，
例如 `https://oss-cn-hangzhou-internal.aliyuncs.com` 或其
`s3.oss-...` 形式；已知的旧 Endpoint 会自动转换为 S3 兼容形式。

:::danger 中国内地 CNAME 限制
当前上传实现不支持绑定到单个 Bucket 的 CNAME Endpoint。若阿里云账号要求通过
CNAME 访问中国内地 Bucket，则不能使用 `surgio upload`。请勿将 CNAME 填入
`upload.endpoint`，配置校验会拒绝该地址。
:::

### Cloudflare R2

```js
module.exports = {
  upload: {
    backend: 'r2',
    bucket: 'example-bucket',
    accountId: '0123456789abcdef0123456789abcdef',
    prefix: '/',
  },
};
```

欧盟或 FedRAMP Jurisdiction Bucket 需要额外设置 `jurisdiction`：

```js
upload: {
  backend: 'r2',
  bucket: 'example-bucket',
  accountId: '0123456789abcdef0123456789abcdef',
  jurisdiction: 'eu', // 也可以是 'fedramp'
}
```

### 其它 S3 兼容服务

```js
module.exports = {
  upload: {
    backend: 's3',
    bucket: 'example-bucket',
    endpoint: 'https://objects.example.com',
    region: 'us-east-1',
    pathStyle: true,
    prefix: '/',
  },
};
```

`endpoint` 必须是 HTTP 或 HTTPS URL，不能包含路径、认证信息、查询参数或锚点。
`pathStyle` 默认值为 `true`；若服务要求 Virtual-hosted-style 请求，请设置为
`false`。

### upload.backend

- 类型：`'oss' | 'r2' | 's3'`
- 默认值：`oss`

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
- OSS 默认值：`cn-hangzhou`
- S3 后端：必须

### upload.endpoint

- 类型：`string`
- S3 后端：必须

### upload.accountId

- 类型：`string`
- R2 后端：必须

Cloudflare Account ID，为 32 位十六进制字符串。

### upload.jurisdiction

- 类型：`'eu' | 'fedramp'`
- 默认值：`undefined`

仅用于 R2 Jurisdiction Bucket。

### upload.pathStyle

- 类型：`boolean`
- S3 后端默认值：`true`

仅用于通用 S3 后端。

### upload.accessKeyId

- 类型：`string`
- 默认值：`undefined`

:::warning 注意
推荐使用 `S3_BACKEND_ACCESS_KEY_ID` 环境变量，不要将该字段上传至公共仓库。
:::

### upload.accessKeySecret

- 类型：`string`
- 默认值：`undefined`

:::warning 注意
推荐使用 `S3_BACKEND_ACCESS_KEY_SECRET` 环境变量，不要将该字段上传至公共仓库。
:::

## surgeConfig

- 类型：`object`
- 默认值：`undefined`

```js
// surgio.conf.js
module.exports = {
  surgeConfig: {},
};
```

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
- 默认值：`clash.meta`
- 可选值：`clash`, `clash.meta`, `mihomo`, `stash`

Clash 核心版本。默认使用 Mihomo（`clash.meta`）。`mihomo` 是 `clash.meta` 的别名，加载配置时会被归一化为 `clash.meta`。如果需要继续为旧版 Clash 生成配置，请显式设置为 `clash`。

下面是目前支持的变化：

| 核心 | 变化 |
| --- | --- |
| `clash` | 使用旧版 Clash 的节点字段和规则过滤行为 |
| `clash.meta` | 默认值；模板 `clash` 过滤器会改为过滤 Mihomo 不支持的规则 |
| `mihomo` | `clash.meta` 的输入别名，加载后统一为 `clash.meta` |
| `stash` | Hysteria 协议的密码字段改为 `auth`；模板 `clash` 过滤器会改为过滤 Stash 不支持的规则 |

:::warning 注意
`enableTuic`, `enableShadowTls`, `enableHysteria2`, `enableVless` 这几个配置项和 `clashCore` 目前互不影响。将默认核心改为 Mihomo 不会自动开启这些协议。
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

是否解析节点的域名。开启此功能后 Surgio 会将节点的域名解析为 IP 地址，这样可能可以加速节点的连接速度。

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

定义缓存的实现方式。默认情况下，Surgio 将缓存持久化到系统临时目录中的文件；Serverless 环境可以使用 Upstash REST，Cloudflare Worker 可以注入 KV binding。所有实现共享同一套 TTL 行为，TTL 的单位为毫秒。

### cache.type

- 类型：`string`
- 默认值：`filesystem`
- 可选值：`filesystem`, `upstash`, `default`

定义：

- `filesystem`：使用本地文件存储，也是默认值
- `upstash`：使用 Upstash Redis REST 接口
- `default`：`filesystem` 的兼容别名

### cache.directory

- 类型：`string`
- 默认值：系统临时目录中的 Surgio cache 目录

仅适用于 `filesystem`。可以用它指定缓存文件的存储目录：

```js
module.exports = {
  // ...
  cache: {
    type: 'filesystem',
    directory: '/var/cache/surgio',
  },
};
```

### Upstash REST

将 `cache.type` 设置为 `upstash` 后，Surgio 优先读取配置中的 `upstashRestUrl` 和 `upstashRestToken`，未配置的字段再从 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 环境变量读取。

建议通过环境变量提供凭据：

```js
module.exports = {
  // ...
  cache: {
    type: 'upstash',
  },
};
```

也可以显式配置 Upstash 实例：

```js
module.exports = {
  // ...
  cache: {
    type: 'upstash',
    upstashRestUrl: 'https://example.upstash.io',
    upstashRestToken: process.env.MY_UPSTASH_TOKEN,
  },
};
```

### Cloudflare KV binding

Cloudflare KV binding 是运行时对象，不写入 `surgio.conf.js`。在首次缓存访问前显式注入：

```js
import { env } from 'cloudflare:workers';
import { cache } from 'surgio';
import { createCloudflareKvStore } from 'surgio/cache';

cache.useStore(createCloudflareKvStore(env.SURGIO_CACHE));
```

Cloudflare KV 是最终一致的存储：其他区域可能在最多约 60 秒内读到旧值，`keys` 和 `reset` 也受相同限制。Cloudflare 的物理过期最短为 60 秒；Surgio 会在缓存记录中保存精确的逻辑过期时间，因此不会返回逻辑上已经过期的值。

:::warning 注意
Cloudflare KV 适配器只代表 Surgio 的缓存模块可以使用 KV binding，并不表示 Surgio 的其它 Node.js 和文件系统功能可以直接运行在任意 Cloudflare Worker 环境中。
:::

## 环境变量

Surgio 支持使用 [环境变量](/guide/env.md) 来调整没有公开的配置，但属于高级用法，请酌情使用。
