---
sidebarDepth: 1
---

# sing-box

> <Badge text="v3.7.0" vertical="middle" />

因为 sing-box 的配置文件为 JSON 格式，所以我们引入了一种新的方式来维护 sing-box 规则，或是其它 JSON 格式的规则。

## 准备

首先我们找到一份基础的规则文件，它可能是这样的：

```json
{
  "inbounds": [],
  "outbounds": [
    {
      "type": "block",
      "tag": "block"
    },
    {
      "type": "dns",
      "tag": "dns"
    }
  ],
  "route": {},
  "experimental": {
    "cache_file": {
      "enabled": true
    },
    "clash_api": {
      "external_controller": "127.0.0.1:9090"
    }
  }
}
```

我们看到此时 `outbounds` 已经包含了一些内容，我们要做的就是把节点信息填充到 `outbounds` 中。

把这个文件保存在 `tempalte` 目录下，命名为 `singbox.json`。

## 编写 Artifact

```js {9-26}
const { extendOutbounds } = require('surgio');

module.exports = {
  artifacts: [
    {
      name: 'singbox.json',
      template: 'singbox',
      templateType: 'json',
      extendTemplate: extendOutbounds(
        ({ getSingboxNodes, getSingboxNodeNames, nodeList }) => [
          {
            type: 'direct',
            tag: 'direct',
            tcp_fast_open: false,
            tcp_multi_path: true,
          },
          {
            type: 'selector',
            tag: 'proxy',
            outbounds: ['auto', ...getSingboxNodeNames(nodeList)],
            // outbounds: getSingboxNodeNames(nodeList), // 如果你不需要 auto 节点
            interrupt_exist_connections: false,
          },
          ...getSingboxNodes(nodeList),
        ],
      ),
      provider: 'ss',
    },
  ]
}
```

这个配置的含义是：

- `template` 为 `singbox`，即我们刚刚创建的模板文件
- `extendTemplate` 为 `extendOutbounds`，这个函数会把节点信息填充到 `outbounds` 中 

第 10 行的 `getSingboxNodes`, `getSingboxNodeNames` 属于「模板方法」，具体有哪些可用的模板方法可以看 [这里](/guide/custom-template.md#模板方法)。

## `extendOutbounds` 函数

`extendOutbounds` 支持两种写法，一种是直接输入一个不可变的变量，另一种是输入一个函数。变量即确定的不会变化的内容，函数则是相对动态的内容。上面的例子中我们使用了函数的写法。

### 直接输入变量

```js
const { extendOutbounds } = require('surgio');

module.exports = {
  artifacts: [
    {
      name: 'singbox.json',
      template: 'singbox',
      templateType: 'json',
      extendTemplate: extendOutbounds([
        {
          type: 'direct',
          tag: 'direct',
          tcp_fast_open: false,
          tcp_multi_path: true,
        },
      ]),
      provider: 'ss',
    },
  ]
}
```

你可以在 [这里](/guide/custom-template.md#模板方法) 查看这篇文章中提到的所有模板方法的文档。
