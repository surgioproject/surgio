---
title: Artifact 产品
sidebarDepth: 2
---

# Artifact 产品

Surgio 会根据 Artifact 的值来生成配置文件。你可以一次性配置多个 Artifact，一次性生成所有需要的配置文件。

```js
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
- 被合并的 Provider 的过滤器中仅 `nodeFilter` 生效。
- `provider` 定义的主要 Provider 中的过滤器（包括自定义过滤器）会对合并的 Provider 生效。
:::

例如：

最终生成的节点配置会包含 `my-provider`, `rixcloud`, `dlercloud` 三个 Provider 的节点。如果 `my-provider` 中定义了过滤器，那这些过滤器对 `rixcloud` 和 `dlercloud` 节点同样有效。

```js
{
  provider: 'my-provider',
  combineProviders: ['rixcloud', 'dlercloud'],
}
```

### customParams

- 类型: `object`
- 默认值: `{}`

自定义的模板对象。可以在模板中获取，方便定义更加定制化的模板。

例如：

```js
{
  customParams: {
    beta: true
  },
}
```

此后即可在模板中使用 `{% if customParams.beta %}{% endif %}`，让你仅通过一个模板就能实现多种不同的配置。Nunjucks 的条件语法请参考其文档。

## 方法

### proxyGroupModifier

`proxyGroupModifier(nodeList, filters)`

- 类型: `Function`
- 入参: `(NodeConfig[], { hkFilter, usFilter, netflixFilter, youtubePremiumFilter })`
- 返回值: `object[]`

为了解决 Clash 的 `Proxy Group` 组装引入了这个构造函数。在使用 [`clashProxyConfig` 模板变量](/guide/custom-template#clashproxyconfig) 之前必须要自己实现这个方法。

方法返回的数组中可以包含以下几种对象：

*1. 完整的代理选择列表*

```js
{
  name: '🚀 Proxy',
  type: 'select',
}
```

*2. 经过过滤的代理选择列表*

```js
{
  name: '🎬 Netflix',
  filter: filters.netflixFilter,
  type: 'select',
}
```

:::tip
内置的 `filters` 会被 Provider 中定义的 filter 覆盖
:::

*3. 经过过滤的代理自动测速列表*

```js
{
  name: 'US',
  filter: filters.usFilter,
  type: 'url-test',
}
```

*4. 自定义的代理选择列表*

```js
{
  name: '🍎 Apple',
  proxies: ['DIRECT', '🚀 Proxy', 'US', 'HK'],
  type: 'select',
}
```

:::warning 注意
`proxies` 中的代理名称必须已被定义
:::

*4. 自定义的代理自动测速列表*

```js
{
  name: '🍎 Apple',
  proxies: ['🚀 Proxy', 'US', 'HK'],
  type: 'url-test',
}
```
