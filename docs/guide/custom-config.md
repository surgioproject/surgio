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

数组内容见 [自定义 Artifact](/guide/custom-artifact)。

### urlBase

- 类型: `string`
- 默认值: `/`

规则文件的下载地址前缀。

:::warning 注意
以 `/` 结尾，如：`https://example.com/` 。
:::

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
