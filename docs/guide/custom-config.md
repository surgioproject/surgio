---
title: 配置文件
sidebarDepth: 2
---

# 配置文件

Surgio 的配置文件位于目录内的 `surgio.conf.js`。

## 属性

```js
module.exports = {
  artifacts: [],
  urlBase: 'https://example.com/',
  upload: {},
  binPath: {},
};
```

### artifacts

- 类型: `Artifact[]`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

数组内容见 [自定义 Artifact](/guide/custom-artifact.md)。

### urlBase

- 类型: `string`
- 默认值: `/`

规则文件的下载地址前缀。

:::warning 注意
以 `/` 结尾，如：`https://example.com/` 。
:::


### remoteSnippets

- 类型: `RemoteSnippet[]`
- 默认值: `undefined`

:::tip
这个功能和 Surge 本身的 `RULE-SET` 功能无关，所以生成出来的规则可以在老版本的 Surge 和其它客户端中使用。
:::

远程片段。你可以在这里配置符合 [Surge Rule Set 标准](https://nssurge.zendesk.com/hc/zh-cn/articles/360010038714-Surge-Mac-3-Release-Note) 的文件，然后在模板中使用它们。

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

### upload

- 类型: `object`
- 默认值: `undefined`

上传阿里云 OSS 的配置。

:::warning 注意
- 若删除了某个 Artifact，该规则文件会从 OSS 中删除
- 每次上传都会覆盖原有的文件，所以请不要更改 OSS 中的文件
- 请不要通过 CDN 访问 OSS 内的文件，这样会导致更新不即时且很难删除
:::

#### upload.prefix

- 类型: `string`
- 默认值: `/`

默认保存至根目录，可以修改子目录名，以 / 结尾

#### upload.bucket

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

#### upload.region

- 类型: `string`
- 默认值: `oss-cn-hangzhou`

#### upload.accessKeyId

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
请不要将该字段上传至公共仓库。
:::

#### upload.accessKeySecret

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
请不要将该字段上传至公共仓库。
:::

### binPath

如果需要生成针对 Surge 的 V2Ray 或 SSR 订阅，需要额外配置此项。

#### binPath.v2ray

- 类型: `string`
- 默认值: `undefined`

V2Ray 的可执行文件地址，通常是 `/usr/local/bin/v2ray`。

#### binPath.shadowsocksr

- 类型: `string`
- 默认值: `undefined`

SSR 的可执行文件地址。请使用 libev 版本的二进制文件，可以在 [这篇文章](/guide/advance/surge-advance.md) 找到下载地址和使用方法。

### surgeConfig

- 类型: `object`
- 默认值: `undefined`

#### surgeConfig.v2ray

- 类型: `string`
- 默认值: `external`
- 可选值: `external|native`

:::warning 注意
仅 Surge 4 for iOS 和 Surge 3.3.1 (894) for macOS 之后的版本支持 `native` 方式。
:::

定义生成 Vmess 节点配置的类型，默认使用 External Provider 的形式，兼容性更好。也可以选择使用 `native` 的方式。

### gateway <Badge text="v1.1.0" vertical="middle" />

- 类型: `object`
- 默认值: `undefined`

托管 API 相关配置

#### gateway.auth

- 类型: `boolean`
- 默认值: `false`

是否开启鉴权，默认关闭。若开启则需要在访问 URL 上增加参数 `access_token`。

#### gateway.accessToken

- 类型: `string`
- 默认值: `undefined`

鉴权码。
