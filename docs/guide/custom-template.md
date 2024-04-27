---
title: Template 模板
sidebarDepth: 2
---

# Template 模板

Surgio 为了能够灵活地定义模板而引入了 [Nunjucks](https://nunjucks.bootcss.com/)。

需要注意的是文件名即为该 Template 的名称，后面在定义 Artifact 时会用到。

目录中默认已经包含针对 Surge，Quantumult 和 Clash 的模板和一些网友维护的规则片段 Snippet。

:::tip 提示
欢迎大家参与到默认规则的修订中！

[项目地址](https://github.com/geekdada/create-surgio-store/tree/master/template/template)
:::

## 模板变量

### 如何在模板中使用变量？

```md
相信聪明的你已经洞察一切。对，就是用 `{{ }}` 把变量包裹起来。
```

```html
<!-- .tpl 文件 -->
{{ downloadUrl }}
```

对于 `customParams`，则可以像这样：

```html
<!-- .tpl 文件 -->
{{ customParams.variable }}
```

### providerName

- 类型: `string`

当前 Provider 的名称。

### downloadUrl

- 类型: `string`

当前文件对应的订阅地址。

### proxyTestUrl

- 类型: `string`
- 默认值: `http://cp.cloudflare.com/generate_204`

节点测试地址。Surgio 会内置一个推荐的测试地址，你可以直接在模板文件中使用。如果在设置中使用了新的地址，这里也会变成所设的值。

### nodeList

- 类型: `object[]`

过滤之后的节点列表。

### remoteSnippets

- 类型: `object`

远程模板片段。假如你已经配置了一个像 [这样](/guide/custom-config.md#remotesnippets) 的远程片段，那就能够以下面的方式使用。

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

如果你需要直接读取远程片段的内容，可以在模板里这样写：

```
{{ remoteSnippets.cn.text }}
```

其他变量

- remoteSnippets.cn.url - 下载地址
- remoteSnippets.cn.name - 片段名

### customParams

- 类型: `object`

获取自定义的模板参数。请 [先在 Artifact 中定义](/guide/custom-artifact.md#customparams) 再使用。

## 过滤器

### 如何使用过滤器？

我们以 `getSurgeNodes` 为例。默认情况下，使用 `getSurgeNodes(nodeList)` 输出的是所有节点。如果我们在第二个参数的位置传入过滤器，即可过滤想要的节点。

```html
<!-- .tpl 文件 -->
{{ getSurgeNodes(nodeList, netflixFilter) }}
```

这样即可输出支持 Netflix 的节点。

自定义过滤器的使用也非常类似。

```html
<!-- .tpl 文件 -->
{{ getSurgeNodes(nodeList, customFilters.this_is_a_filter) }}
```

### 国家和地区过滤器

Surgio 内置多个节点名国别/地区过滤器。除非是火星文，Surgio 应该都能识别出来。它们是：

- hkFilter
- usFilter
- japanFilter
- singaporeFilter
- koreaFilter
- taiwanFilter
- chinaBackFilter（得到回国节点）
- chinaOutFilter（得到出国节点）

### 协议过滤器

某些订阅中会混合多种不同的协议，你可以用以下这些过滤器过滤出想要的节点类型。它们是：

- shadowsocksFilter
- shadowsocksrFilter
- vmessFilter
- v2rayFilter
- snellFilter
- httpFilter
- httpsFilter
- trojanFilter
- socks5Filter
- tuicFilter
- wireguardFilter

### netflixFilter

Netflix 节点过滤器。Surgio 默认会将名称中包含 *netflix*, *hkbn*, *hkt*, *hgc*（不分大小写）的节点过滤出来。如果在 Provider 中进行了覆盖则会运行新的方法。

[内置方法定义](https://github.com/geekdada/surgio/blob/master/lib/utils/filter.ts#L38)

### youtubePremiumFilter

Youtube Premium 节点过滤器。Surgio 默认会将名称中包含 *日*, *美*, *韩*, 🇯🇵, 🇺🇸, 🇰🇷 的节点过滤出来。如果在 Provider 中进行了覆盖则会运行新的方法。

- [内置方法定义](https://github.com/geekdada/surgio/blob/master/lib/utils/filter.ts#L81)
- [查看所有支持 Youtube Premium 的国家和地区](https://support.google.com/youtube/answer/6307365?hl=zh-Hans)

### customFilters

获取自定义 Filter。关于自定义 Filter 的用法，请阅读 [进阶 - 自定义 Filter](/guide/advance/custom-filter)。

## 模板方法

### 如何在模板中调用方法？

```md
上面提到的这些模板方法都能够在模板文件中使用。原则就是用 `{{ }}` 把方法包裹起来。
```

```html
<!-- .tpl 文件 -->
{{ getSurgeNodes(nodeList) }}
```

### getSurgeNodes

`getSurgeNodes(nodeList, filter?)`

:::tip 提示
- `filter` 为可选参数
- 支持输出 Shadowsocks, Shadowsocksr, HTTPS, Snell, Vmess, Trojan 节点
- 请参考 [「Surge 进阶 - 生成 SSR 和 V2Ray 订阅」](/guide/advance/surge-advance.md) 生成针对 Surge 的 SSR 订阅
:::

生成 Surge 规范的节点列表，例如：

```
[Proxy]
{{ getSurgeNodes(nodeList) }}
```

结果：

```
🇺🇸US = custom, us.example.com, 10000, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true, obfs=tls, obfs-host=gateway-carry.icloud.com
🇭🇰HK(Netflix) = custom, hk.example.com, 10000, chacha20-ietf-poly1305, password, https://raw.githubusercontent.com/ConnersHua/SSEncrypt/master/SSEncrypt.module, udp-relay=true
```

### getSurgeWireguardNodes

> <Badge text="v3.0.0" vertical="middle" />

`getSurgeWireguardNodes(nodeList, filter?)`

`getSurgeNodes` 仅输出 `[Proxy]` 部分的配置，剩余的节点配置需要在模板中使用 `getSurgeWireguardNodes` 输出。

```txt
[Proxy]
{{ getSurgeNodes(nodeList) }}

[Proxy Group]
Proxy = select, {{ getSurgeNodeNames(nodeList) }}

{{ getSurgeWireguardNodes(nodeList) }}
```

:::tip 提示
[Surge - WireGuard 官方文档](https://manual.nssurge.com/policy/wireguard.html)
:::

### getSurgeNodeNames

> <Badge text="v3.0.0" vertical="middle" />

`getSurgeNodes(nodeList, filter?)`

和 `getSurgeNodes` 一样，只不过输出的是节点名称列表。

### getShadowsocksNodes

`getShadowsocksNodes(nodeList, providerName)`

:::tip 提示
- 第二个入参为 Group 名称
:::

生成 Shadowsocks Scheme 列表，例如：

```
ss://cmM0LW1kNTpwYXNzd29yZA@us.com:1234/?group=subscribe_demo#%F0%9F%87%BA%F0%9F%87%B8%20US
ss://cmM0LW1kNTpwYXNzd29yZA@hk.com:1234/?group=subscribe_demo#%F0%9F%87%AD%F0%9F%87%B0%20HK
```

你可以使用 `base64` filter 来将上面的文本转换成 Quantumult 能够识别的订阅内容。

```html
<!-- .tpl 文件 -->
{{ getShadowsocksNodes(nodeList, providerName) | base64 }}
```

### getQuantumultXNodes

`getQuantumultXNodes(nodeList, filter?)`

:::tip 提示
- 第二个参数可选，可传入标准的过滤器或自定义的过滤器
- 支持输出 Shadowsocks, Shadowsocksr, Vmess, HTTPS, Trojan 节点
- 支持添加 `udp-relay` 和 `fast-open` 配置
:::

生成 QuantumulX 的节点配置。该配置能用于 [`server_local`](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf#L88) 或者 [`server_remote`](https://github.com/crossutility/Quantumult-X/blob/master/server-complete.txt)。

### getQuantumultXNodeNames

> <Badge text="v3.0.0" vertical="middle" />

`getQuantumultXNodeNames(nodeList, filter?)`

和 `getQuantumultXNodes` 一样，只不过输出的是节点名称列表。

### getClashNodes

`getClashNodes(nodeList, filter?)`

该方法会返回一个包含有节点信息的数组，用于编写 Clash 规则。

:::tip 提示
- [Clash 规则维护指南](/guide/client/clash.md)
- 支持输出 Shadowsocks, Shadowsocksr, HTTPS, Snell, Vmess, Trojan 节点
:::

### getClashNodeNames

`getClashNodeNames(nodeList, filter?, prependNodeNames?, defaultNodeNames?)`

:::tip 提示
- `filter` 为可选参数
- `prependNodeNames` 为可选参数。可以通过这个参数在过滤结果前加入自定义节点名
- `defaultNodeNames` 为可选参数。可以通过这个参数实现在过滤结果为空的情况下，使用默认的自定义节点名
- [Clash 规则维护指南](/guide/client/clash.md)
:::

该方法会返回一个包含有节点名称的数组，用于编写 Clash 规则。

若需要过滤 Netflix 节点则传入：

```js
getClashNodeNames(nodeList, netflixFilter);
```

需要过滤 Netflix 节点，并且在前面加入节点 `测试节点`

```js
getClashNodeNames(nodeList, netflixFilter, ['测试节点']);
```

需要过滤 Netflix 节点，如果没有 Netflix 相关节点，则使用 `默认节点`

```js
getClashNodeNames(nodeList, netflixFilter, [], ['默认节点']);
```

### getSingboxNodesString

`getSingboxNodesString(nodeList, filter?)`

该方法返回一个字符串，格式为逗号分隔的节点信息json object，便于你组织 sing-box 的前后 outbound。例如：

```json5
{
  "outbounds": [
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": {{ getSingboxNodeNames(nodeList, null, ['auto']) | json }},
    "interrupt_exist_connections": false
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": {{ getSingboxNodeNames(nodeList) | json }},
    "url": "{{ proxyTestUrl }}",
    "interrupt_exist_connections": false
    },
    {{ getSingboxNodesString(nodeList) }},
    {
      "type": "direct",
      "tag": "direct",
      "tcp_fast_open": true,
      "tcp_multi_path": true
    },
    {
      "type": "block",
      "tag": "block"
    },
    {
      "type": "dns",
      "tag": "dns"
    }
  ]
}
```

### getSingboxNodes

`getSingboxNodes(nodeList, filter?)`

该方法会返回一个包含有节点信息的数组，可用于编写 sing-box 规则。

### getSingboxNodeNames

`getSingboxNodeNames(nodeList, filter?, prependNodeNames?, defaultNodeNames?)`

该方法会返回一个包含有节点名称的数组，用于编写 sing-box 规则，可参考上方`getSingboxNodesString`的示例。

:::tip 提示
- `filter` 为可选参数
- `prependNodeNames` 为可选参数。可以通过这个参数在过滤结果前加入自定义节点名
- `defaultNodeNames` 为可选参数。可以通过这个参数实现在过滤结果为空的情况下，使用默认的自定义节点名
:::

若需要过滤 Netflix 节点则传入：

```js
getSingboxNodeNames(nodeList, netflixFilter);
```

需要过滤 Netflix 节点，并且在前面加入节点 `测试节点`

```js
getSingboxNodeNames(nodeList, netflixFilter, ['测试节点']);
```

需要过滤 Netflix 节点，如果没有 Netflix 相关节点，则使用 `默认节点`

```js
getSingboxNodeNames(nodeList, netflixFilter, [], ['默认节点']);
```

### getLoonNodes

`getLoonNodes(nodeList, filter?)`

:::tip 提示
- 第二个参数可选，可传入标准的过滤器或自定义的过滤器
- 支持输出 Shadowsocks, Shadowsocksr, HTTPS, HTTP, Vmess, Trojan 节点
:::

生成符合 `[Proxy]` 规范的节点信息，使用时请参考 [文档](https://www.notion.so/1-9809ce5acf524d868affee8dd5fc0a6e)。

示例：

```
[Proxy]
{{ getLoonNodes(nodeList) }}
```

### getLoonNodeNames

> <Badge text="v3.0.0" vertical="middle" />

`getLoonNodeNames(nodeList, filter?)`

和 `getLoonNodes` 一样，只不过输出的是节点名称列表。

### getSurfboardNodes

`getSurfboardNodes(nodeList, filter?)`

:::tip 提示
- `filter` 为可选参数，可传入标准的过滤器或自定义的过滤器
- 支持输出 Shadowsocks, HTTPS, HTTP, Vmess, Trojan 节点
:::

使用时请参考 [官方文档](https://getsurfboard.com/docs/profile-format/overview)。

示例：

```
[Proxy]
{{ getSurfboardNodes(nodeList) }}
```

### getSurfboardNodeNames

> <Badge text="v3.0.0" vertical="middle" />

`getSurfboardNodeNames(nodeList, filter?)`

和 `getSurfboardNodes` 一样，只不过输出的是节点名称列表。

### getNodeNames

`getNodeNames(nodeList, filter?, separator?)`

:::tip 提示
- 不同于 `getXxxxNodeNames` 方法，该方法不会根据节点类型进行过滤
- `filter` 为可选参数
- `separator` 为可选参数。可以通过这个参数修改节点名的分隔符
:::

生成一段逗号分隔的名称字符串，例如：

```
🇺🇸US, 🇭🇰HK(Netflix)
```

若需要过滤 Netflix 节点则传入：

```js
getNodeNames(nodeList, netflixFilter);
```

如果只需要更改分隔符则这样写：

```js
getNodeNames(nodeList, undefined, ':');
```

### getDownloadUrl

`getDownloadUrl(name)`

获得另一个文件的下载地址（链接前面部分取决于 `surgio.conf.js` 中 `urlBase` 的值），则可以这样写：

```js
getDownloadUrl('example.conf'); // https://example.com/example.conf
```

你也可以在文件名后携带 URL 参数，`getDownloadUrl` 会在解析时候组装完整的 URL，例如：

```js
getDownloadUrl('example.conf?foo=bar'); // https://example.com/example.conf?foo=bar
```

:::tip 提示
请不用担心参数中的 `access_token`，如果需要会自动加上的 👌。
:::

### getUrl

`getUrl(path)`

拼装完整的 URL。这个方法和 `getDownloadUrl` 不同的地方是 —— 它更通用。将来 Surgio 可能会在面板增加新的 API，你可以用这个方法来获取完整的地址，例如：

```
getUrl('/export-provider?format=surge-policy');
```

### snippet

`snippet(path)`

方便将本地的 Surge 规则片段转换为类似远程片段用法，免去人工创建特定的片段格式（即后面提到的宏）。

:::tip 提示
- 文件路径均相对于 template 目录进行提取，这和 Nunjucks 的路径写法有所不同；
- 通过这个方法获取的片段只能有一种策略，相对于正规片段有所限制；
:::

假设存在一个片段 __template/snippet/rule.tpl__，内容为：

```
USER-AGENT,com.google.ios.youtube*
USER-AGENT,YouTube*
DOMAIN-SUFFIX,googlevideo.com
DOMAIN-SUFFIX,youtube.com
DOMAIN,youtubei.googleapis.com
PROCESS-NAME,YT Music
```

你则可以在模板中这样使用：

```
{{ snippet("snippet/rule.tpl").main("Proxy") }}
```

和远程片段一样，`.text` 可以获取到原始的字符串内容。

## 片段 (Snippet)

### 如何使用片段？

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

:::tip 提示
- 宏暴露了一个 `main` 方法，传入一个字符串变量
- 你可以使用 Nunjucks 宏的其它特性
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

```html
<!-- .tpl 文件 -->
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

[rules]
{% filter clash %}
  {{ blocked_rules.main('🚀 Proxy') }}
{% endfilter %}
```

最终得到的规则是：

```
[rules]
- DOMAIN-KEYWORD,bitly,🚀 Proxy
- DOMAIN-KEYWORD,blogspot,🚀 Proxy
- DOMAIN-KEYWORD,dropbox,🚀 Proxy
- DOMAIN-SUFFIX,twitpic.com,🚀 Proxy
- DOMAIN-SUFFIX,youtu.be,🚀 Proxy
- DOMAIN-SUFFIX,ytimg.com,🚀 Proxy
```

需要注意的是，`clash` 除了更改格式，还会将 Clash 不支持的规则类型省略，例如：

- USER-AGENT

从 v3.5.0 开始，Surgio 还内置了两个新的 Clash 规则格式处理器 `stash` 和 `clashMeta`，他们会依据不同内核的支持情况进行处理。需要注意的是，假如你设定了 `clashConfig.clashCore`，`clash` 处理器会被自动替换为 `clashConfig.clashCore`。 

### Quantumult X 规则处理

处理后的规则仅包含 [这里](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf#L103) 列出的几种 Quantumult X 支持的规则类型，以及 `DOMAIN`, `DOMAIN-SUFFIX`, `DOMAIN-KEYWORD`。

```html
<!-- .tpl 文件 -->
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

{{ blocked_rules.main('🚀 Proxy') | quantumultx }}
```

除此之外，规则处理模块还支持以下功能。

#### 转换 Surge Script 规则

规则处理模块能够识别以下类型的 Surge Script 规则，转换成 Quantumult X 的 Rewrite 规则。需要注意的是，为了能够正常使用这些规则，你需要部署 Surgio 托管 API。

由于 Surge Ruleset 的定义中不包含 Script 部分，所以当你要转换 Script 规则时推荐使用下面的方案。

我们前面已经介绍过如何定义规则片段，你要做的就是把要转换的规则全部放进一个规则片段中，例如：

```html
<!-- ./snippet/surge_script.tpl -->

{% macro main() %}
http-response ^https?://m?api\.weibo\.c(n|om)/2/(statuses/(unread|extend|positives/get|(friends|video)(/|_)timeline)|stories/(video_stream|home_list)|(groups|fangle)/timeline|profile/statuses|comments/build_comments|photo/recommend_list|service/picfeed|searchall|cardlist|page|\!/photos/pic_recommend_status) script-path=https://raw.githubusercontent.com/yichahucha/surge/master/wb_ad.js,requires-body=true
http-response ^https?://(sdk|wb)app\.uve\.weibo\.com(/interface/sdk/sdkad.php|/wbapplua/wbpullad.lua) script-path=https://raw.githubusercontent.com/yichahucha/surge/master/wb_launch.js,requires-body=true
{% endmacro %}
```

然后在模板文件中引用：

_for Surge_

```{4}
{% import './snippet/surge_script.tpl' as surge_script %}

[Script]
{{ surge_script.main() }}
```

_for Quantumult X_

```{4}
{% import './snippet/surge_script.tpl' as surge_script %}

[rewrite_local]
{{ surge_script.main() | quantumultx }}
```

:::warning 注意
Surgio 不会处理类似 `[rewrite_local]` 这样的标题，所以请 **不要** 将它们也放到片段中。
:::

### Loon 规则处理

处理后的规则仅包含 [这里](https://www.notion.so/2-967c1a07462c43ab88906162bec475a4) 列出的几种规则类型。

```html
<!-- .tpl 文件 -->
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

{{ blocked_rules.main('🚀 Proxy') | loon }}
```

### Surfboard 规则处理

处理后的规则仅包含 [这里](https://getsurfboard.com/docs/profile-format/rule/) 列出的几种规则类型。

```html
<!-- .tpl 文件 -->
{% import './snippet/blocked_rules.tpl' as blocked_rules %}

{{ blocked_rules.main('🚀 Proxy') | surfboard }}
```
