---
title: Template 模板
sidebarDepth: 2
---

# Template 模板

Surgio 为了能够灵活地定义模板而引入了 [Nunjucks](https://nunjucks.bootcss.com/)。

需要注意的是文件名即为该 Template 的名称，后面在定义 Artifact 时会用到。

目录中默认已经包含针对 Surge，Quantumult 和 Clash 的模板和一些网友维护的规则片段 Snippet。

:::tip
欢迎大家参与到默认规则的修订中！

[项目地址](https://github.com/geekdada/create-surgio-store/tree/master/template/template)
:::

## 模板变量

### providerName

当前 Provider 的名称。

### downloadUrl

当前文件对应的订阅地址。

### nodeList

过滤之后的节点列表。

### remoteSnippets

远程模板片段。以 [这个配置](/guide/custom-config.md#remotesnippets) 为例：

```
{{ remoteSnippets.cn.main('DIRECT') }}
```

生成的内容如下：

```
# China Apps
USER-AGENT,MicroMessenger Client,DIRECT
USER-AGENT,WeChat*,DIRECT
USER-AGENT,MApi*,DIRECT // Dianping
# Ali
DOMAIN-KEYWORD,alipay,DIRECT
DOMAIN-KEYWORD,taobao,DIRECT
DOMAIN-KEYWORD,alicdn,DIRECT
DOMAIN-KEYWORD,aliyun,DIRECT
DOMAIN-KEYWORD,.tmall.,DIRECT
# China
DOMAIN-SUFFIX,CN,DIRECT
DOMAIN-KEYWORD,baidu,DIRECT
```

### hkFilter

香港节点过滤器。

### usFilter

美国节点过滤器。

### netflixFilter

Netflix 节点过滤器。Surgio 默认会将名称中包含 *netflix*, *hkbn*, *hkt*, *hgc*（不分大小写）的节点过滤出来。如果在 Provider 中进行了覆盖则会运行新的方法。

### youtubePremiumFilter

Youtube Premium 节点过滤器。Surgio 默认会将名称中包含 *日*, *美*, *韩*, 🇯🇵, 🇺🇸, 🇰🇷 的节点过滤出来。如果在 Provider 中进行了覆盖则会运行新的方法。

[查看所有支持 Youtube Premium 的国家和地区](https://support.google.com/youtube/answer/6307365?hl=zh-Hans)

### clashProxyConfig

Clash 的 `Proxy` 和 `Proxy Group` 配置对象。`clashProxyConfig` 的内容依赖 Artifact 的 [`proxyGroupModifier` 函数](/guide/custom-artifact.md#proxygroupmodifier-nodelist-filters)。

由于很难在模板中直接书写 Yaml 格式的文本，所以引入了一个特殊的变量用来存储 Clash 的节点配置，然后利用 Nunjucks 的 [filter](https://nunjucks.bootcss.com/templating.html#part-cda1d805a3577fa5) 来输出 Yaml 格式文本。

```
{{ clashProxyConfig | yaml }}
```

:::tip
你当然可以在模板中使用 Nunjucks 内置的 filter。
:::

## 模板方法

### `getSurgeNodes(nodeList, filter?)`

:::tip
- `filter` 为可选参数
- 支持输出 Shadowsocks, HTTPS, Snell 节点
:::

生成 Surge 规范的节点列表，例如：

```
🇺🇸US = custom, us.example.com, 10000, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=gateway-carry.icloud.com
🇭🇰HK(Netflix) = custom, hk.example.com, 10000, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true
```

### `getShadowsocksNodes(nodeList, providerName)`

:::tip
- 第二个入参为 Group 名称
:::

生成 Shadowsocks Scheme 列表，例如：

```
ss://cmM0LW1kNTpwYXNzd29yZA@us.com:1234/?group=subscribe_demo#%F0%9F%87%BA%F0%9F%87%B8%20US
ss://cmM0LW1kNTpwYXNzd29yZA@hk.com:1234/?group=subscribe_demo#%F0%9F%87%AD%F0%9F%87%B0%20HK
```

你可以使用 `base64` filter 来将上面的文本转换成 Quantumult 能够识别的订阅内容。

```
{{ getShadowsocksNodes(nodeList, providerName) | base64 }}
```

### `getQuantumultNodes(nodeList, providerName)`

:::tip
- 第二个入参为 Group 名称
- 支持输出 Shadowsocks, Shadowsocksr, Vmess, HTTPS 节点
:::

生成 Quantumult 订阅 Scheme 列表，例如：

```
vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Ikhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXVVzZXItQWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxMl8zXzEgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBNb2JpbGUvMTVFMTQ4Ig==
vmess://5rWL6K+VIDIgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXRjcCxvYmZzLXBhdGg9Ii8iLG9iZnMtaGVhZGVyPSJIb3N0OjEuMS4xLjFbUnJdW05uXVVzZXItQWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxMl8zXzEgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBNb2JpbGUvMTVFMTQ4Ig==
```

你可以使用 `base64` filter 来将上面的文本转换成 Quantumult 能够识别的订阅内容。

```
{{ getQuantumultNodes(nodeList, providerName) | base64 }}
```

### `getNodeNames(nodeList, nodeTypeList?, filter?)`

:::tip
- `nodeTypeList`, `filter` 为可选参数
:::

生成一段逗号分隔的名称字符串，例如：

```
🇺🇸US, 🇭🇰HK(Netflix)
```

若不传 `nodeTypeList` 则默认输出 Shadowsocks 节点。若需要同时输出其它类型节点则传入：

```js
getNodeNames(nodeList, ['shadowsocks', 'https']);
```

若需要过滤 Netflix 节点则传入：

```js
getNodeNames(nodeList, ['shadowsocks'], netflixFilter);
```

### `getDownloadUrl(name)`

获得另一个文件的下载地址（链接前面部分取决于 `surgio.conf.js` 中 `urlBase` 的值），则可以这样写：

```js
getDownloadUrl('example.conf'); // https://example.com/example.conf
```

## 片段 (Snippet)

片段是一种特殊的模板，它依赖 Nunjucks 的 [宏（macro）](https://mozilla.github.io/nunjucks/cn/templating.html#macro) 来实现。什么是宏不重要，你只要依葫芦画瓢就可以写出自己的「片段」。

我们以 `snippet` 目录内的 `blocked_rules.tpl` 为例（内容有省略）：

```
{% macro main(rule) %}
DOMAIN-KEYWORD,bitly,{{ rule }}
DOMAIN-KEYWORD,blogspot,{{ rule }}
DOMAIN-KEYWORD,dropbox,{{ rule }}
DOMAIN-SUFFIX,twitpic.com,{{ rule }}
DOMAIN-SUFFIX,youtu.be,{{ rule }}
DOMAIN-SUFFIX,ytimg.com,{{ rule }}
{% endmacro %}
```

:::tip
- 宏暴露了一个 `main` 方法，传入一个字符串变量
- 你可以使用宏的其它特性
:::

使用的时候只需要 `import` 这个模板：

```
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

{{ blocked_rules.main('🚀 Proxy') }}
```

最终得到的规则是：

```
DOMAIN-KEYWORD,bitly,🚀 Proxy
DOMAIN-KEYWORD,blogspot,🚀 Proxy
DOMAIN-KEYWORD,dropbox,🚀 Proxy
DOMAIN-SUFFIX,twitpic.com,🚀 Proxy
DOMAIN-SUFFIX,youtu.be,🚀 Proxy
DOMAIN-SUFFIX,ytimg.com,🚀 Proxy
```

### Clash 规则格式处理

由于 Yaml 的数组类型必须在每一条数据前加 `-`，所以提供了一个处理函数将规则转换成 Clash 能够识别的数组。

```
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

{{ blocked_rules.main('🚀 Proxy') | patchYamlArray }}
```

最终得到的规则是：

```
- DOMAIN-KEYWORD,bitly,🚀 Proxy
- DOMAIN-KEYWORD,blogspot,🚀 Proxy
- DOMAIN-KEYWORD,dropbox,🚀 Proxy
- DOMAIN-SUFFIX,twitpic.com,🚀 Proxy
- DOMAIN-SUFFIX,youtu.be,🚀 Proxy
- DOMAIN-SUFFIX,ytimg.com,🚀 Proxy
```

需要注意的是，`patchYamlArray` 除了更改格式，还会将 Clash 不支持的规则类型省略，例如：

- USER-AGENT
- PROCESS-NAME
- no-resolve（仅除去该字段，其它部分保留）
