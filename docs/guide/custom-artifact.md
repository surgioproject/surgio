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

### customParams

- 类型: `object`
- 默认值: `{}`

自定义的模板变量。可以在模板中获取，方便定制化模板。

例如：

```js
{
  customParams: {
    beta: true,
    foo: 'bar',
  },
}
```

此后即可在模板中使用 

:::v-pre
`{{ customParams.foo }}`
:::

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

### destDir <Badge text="v1.4.0" vertical="middle" />

- 类型: `string`
- 默认值: `undefined`

该 Artifact 的生成目录。对于本地管理规则仓库的朋友可能会非常有用，你不再需要人肉复制粘贴了。

## 方法

### proxyGroupModifier

`proxyGroupModifier(nodeList, filters)`

- 类型: `Function`
- 入参: `(NodeConfig[], { hkFilter, usFilter, netflixFilter, youtubePremiumFilter })`
- 返回值: `object[]`

:::tip 提示
[Clash 规则维护指南](/guide/client/clash.md)
:::

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
  // proxies: ['Auto'],
}
```

:::tip 提示
- 内置的 `filters` 会被 Provider 中定义的 filter 覆盖
- 假设你有一个名为 `myFilter` 的自定义过滤器，则可以通过 `filters.myFilter` 调用
- 如果包含 `proxies` 节点，则过滤出的节点名会合并到末尾
:::

*3. 经过过滤的代理自动测速列表*

```js
{
  name: 'US',
  filter: filters.usFilter,
  type: 'url-test', // 支持 'url-test', 'fallback', 'load-balance'
  // proxies: ['Auto'],
}
```

:::tip 提示
- 使用原理同上
:::

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

*5. 自定义的代理自动测速列表*

```js
{
  name: '🍎 Apple',
  proxies: ['🚀 Proxy', 'US', 'HK'],
  type: 'url-test', // 支持 'url-test', 'fallback', 'load-balance'
}
```
