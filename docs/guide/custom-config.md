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

### upload

- 类型: ` UploadConfig`
- 默认值: `undefined`

上传阿里云 OSS 的配置。

:::warning 注意
- 若删除了某个 Artifact，该规则文件会从 OSS 中删除
- 每次上传都会覆盖原有的文件，所以请不要更改 OSS 中的文件
- 请不要通过 CDN 访问 OSS 内的文件，这样会导致更新不即时且很难删除
:::

#### UploadConfig.prefix

- 类型: `string`
- 默认值: `/`

默认保存至根目录，可以修改子目录名，以 / 结尾

#### UploadConfig.bucket

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

#### UploadConfig.region

- 类型: `string`
- 默认值: `oss-cn-hangzhou`

#### UploadConfig.accessKeyId

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
请不要将该字段上传至公共仓库。
:::

#### UploadConfig.accessKeySecret

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

:::warning 注意
请不要将该字段上传至公共仓库。
:::
