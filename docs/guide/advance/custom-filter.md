---
title: 自定义 Filter
sidebarDepth: 2
---

# 自定义 Filter（过滤器）

在之前的版本里，我们允许用户使用内置的几个过滤器进行节点过滤。现在 Surgio 已经支持在 Provider 中自定义 Filter。需要提醒一下大家，原来内置的国别过滤器已经拓展了不少，可以在 [这里](/guide/custom-template.md#国别过滤器) 查看。

## 如何自定义

在 Provider 定义中加入 `customFilters` 字段后可以添加任意个 Filter。Filter 在 TypeScript 中的类型为：

```typescript
type NodeNameFilterType = (nodeConfig: SimpleNodeConfig) => boolean;
```

看不懂的同学也不用怕，依葫芦画瓢很简单的哈 🙋‍♂️。

```js
module.exports = {
  url: 'http://example.com/ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    wo_yao_netflix_jie_dian: nodeConfig => nodeConfig.nodeName.includes('Netflix'),
  },
};
```

以上基本就是内置的 `netflixFilter` 实现（滑稽。

## 如何使用

在模板（`tpl` 文件）中你可以使用 `customFilters.wo_yao_netflix_jie_dian`。

Clash 配置比较特殊。你需要到 Artifact 定义的 `proxyGroupModifier` 里使用 `filters.wo_yao_netflix_jie_dian`。例如：

```js
{
  name: '🎬 Netflix',
  filter: filters.wo_yao_netflix_jie_dian,
  type: 'select',
}
```

## 工具方法

很多同学在自定义过滤器时绝大部分时候都希望定义关键词或正则式过滤器，所以 Surgio 提供了几个工具方法方便大家不用写太多代码。

在开干前要介绍一个知识点。这几个工具方法是通过模块引入的，你需要在你的 Provider 文件头部加上一行代码，才能使用它们。

### mergeFilters

把多个过滤器合并。第二个入参是开启严格模式。

默认情况下不同的过滤器间是「或」的关系，开启严格模式后是「和」的关系。

```js
const { utils } = require('surgio');

module.exports = {
  url: 'http://example.com/ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    usNetflixFilter: utils.mergeFilters([utils.usFilter, utils.netflixFilter], true), // 美国的 Netflix 节点
  },
};
```

### useKeywords

生成一个关键词过滤器。第二个入参是开启严格模式。

```js
const { utils } = require('surgio');

module.exports = {
  url: 'http://example.com/ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    gameFilter: utils.useKeywords(['游戏']),
  },
};
```

### discardKeywords <Badge text="v1.1.1" vertical="middle" />

生成一个反向关键词过滤器。第二个入参是开启严格模式。

:::warning 注意
`discardKeywords` 的目的是 **过滤掉**，`useKeywords` 的目的是 **过滤出**。
:::

### useRegexp

生成一个正则表达式过滤器。

:::tip
[JavaScript 正则表达式文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions)
:::

```js
const { utils } = require('surgio');

module.exports = {
  url: 'http://example.com/ss-sub.txt',
  type: 'shadowsocks_subscribe',
  customFilters: {
    iplcFilter: utils.useRegexp(/iplc/i),
  },
};
```
