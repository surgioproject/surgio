---
title: Artifact 产品
sidebarDepth: 2
---

# Artifact 产品

Surgio 会根据 Artifact 的值来生成配置文件。你可以一次性配置多个 Artifact，一次性生成所有需要的配置文件。

```json5
{
  name: 'SurgeV3.conf',
  template: 'surge_v3',
  provider: 'demo',
}
```

## 属性

### name

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

配置文件名

### template

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

模板名。会在 `./template` 目录内寻找同名文件（`.tpl` 后缀可省略）。

### templateType

- 类型: `string`
- 默认值: `default`
- 有效值: `default`, `json`
- <Badge text="可选" vertical="middle" />

模板类型。默认为 `default`，即以传统方式解析模板文件。

### extendTemplate

- 类型: `function`
- 默认值: `undefined`
- <Badge text="可选" vertical="middle" />

拓展 JSON 类型的模板，在编写 sing-box 规则时会用到。

### provider

- 类型: `string`
- 默认值: `undefined`
- <Badge text="必须" vertical="middle" />

模板名。会在 `./provider` 目录内寻找同名文件（`.js` 后缀可省略）。

### combineProviders

- 类型: `string[]`
- 默认值: `undefined`

合并其它 Provider。

:::warning 注意
由于我们可以在 Provider 中定义属于自己的 `customFilters` 和 `nodeFilter`，它们在合并时需要你注意以下几点：
- 不论是主 Provider（即 `provider` 定义的 Provider），还是合并进来的 Provider，它们的 `nodeFilter` 只对自身的节点有效；
- 对于 `customFilters` 来说，只有主 Provider 中定义的才会生效；
:::

例如：

最终生成的节点配置会包含 `my-provider`, `rixcloud`, `dlercloud` 三个 Provider 的节点。如果 `my-provider` 中有自定义过滤器 `customFilters`，那这些过滤器对 `rixcloud` 和 `dlercloud` 节点同样有效。

```js
{
  provider: 'my-provider',
  combineProviders: ['rixcloud', 'dlercloud'],
}
```

### subscriptionUserInfoProvider

- 类型: `string`
- 默认值: `undefined`

默认情况下，仅当 `combineProviders` 为空（Provider只有一个）时才会生成 `subscriptionUserInfo`，即客户端能够识别的流量信息。定义此参数可以指定由哪个 Provider 提供 `subscriptionUserInfo`。

### customParams

- 类型: `object`
- 默认值: `{}`

自定义的模板变量。可以在模板中获取，方便定制化模板。

例如：

```json5
{
  customParams: {
    beta: true,
    foo: 'bar',
  },
}
```

此后即可在模板中使用 

```md
`{{ customParams.foo }}`
```

来输出 `foo` 的内容。

你也可以定义布尔值以实现模板中的逻辑判断，比如：

```html
<!-- .tpl 文件 -->
{% if customParams.beta %}

{% endif %}
```

:::tip 提示
1. 逻辑语句能够让你仅通过一个模板就能实现多种不同的配置。Nunjucks 的条件语法请参考其文档；
2. 你可以[定义全局的自定义模板变量了](/guide/custom-config.md#customparams)；
:::

### destDir

- 类型: `string`
- 默认值: `undefined`

该 Artifact 的生成目录。对于本地管理规则仓库的朋友可能会非常有用，你不再需要手工复制粘贴了。

### destDirs

- 类型: `string[]`
- 默认值: `undefined`

同时指定多个 Artifact 的生成目录。
