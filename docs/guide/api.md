---
sidebarDepth: 2
---

# 托管 API 功能

[[toc]]

:::tip 提示
请先参考 [文档](/guide/advance/api-gateway.md) 搭建托管 API
:::

## 接口鉴权

### 打开鉴权

在 `surgio.conf.js` 中增加如下字段：

```js
module.exports = {
  gateway: {
    auth: true,
    accessToken: 'YOUR_PASSWORD',
    viewerToken: 'ANOTHER_PASSWORD', // 可选
  },
}
```

:::tip 提示
完整的 gateway 配置可以在 [这里](/guide/custom-config.md#gateway) 查看。
:::

### 请求需要鉴权的接口

请在请求的 URL 中加入参数 `access_token`，值为上面所设。

#### 未开启鉴权

```
https://example.com/get-artifact/surge.conf
```

#### 开启鉴权

假如你同时设置了 `accessToken` 和 `viewerToken`，则这两个鉴权码都可用于调用这篇文章中所述的接口。

如果仅设置了 `accessToken`，那么请使用 `accessToken` 进行登录和调用所有接口。

```
https://example.com/get-artifact/surge.conf?access_token=YOUR_PASSWORD
```

## 面板

直接打开 Vercel 分配的域名就可以看到新版的面板。如果开启了鉴权则需登录。

### Artifact 分类

Artifact 配置新增分类，方便在面板中找到想要的 Artifact。Surgio 内置了一些常用的类型，并且还为内置分类增加了个性化的功能。

`categories` 接受一个数组，数组内容可以自定也可以使用内置字段。

```js
const { categories } = require('surgio');

module.exports = {
  artifacts: [
    {
      name: 'SurgeV3.conf',
      template: 'surge_v3',
      provider: 'demo',
      categories: [
        'Maying',
        categories.SURGE,
      ],
    },
    {
      name: 'Surge.conf',
      template: 'surge',
      provider: 'demo',
      categories: [
        categories.SURGE,
      ],
    }
  ],
};
```

以下是所有的内置分类字段：

- `categories.SNIPPET` - 片段
- `categories.SURGE` - Surge
- `categories.QUANTUMULT_X` - Quantumult X 完整配置
- `categories.QUANTUMULT_X_SERVER` - Remote Server 片段
- `categories.QUANTUMULT_X_FILTER` - Remote Filter 片段
- `categories.QUANTUMULT_X_REWRITE` - Remote Rewrite 片段
- `categories.CLASH` - 完整 Clash 配置

## 接口

### 下载 Artifact

```
GET /get-artifact/<artifactName>
```

<Badge text="需要鉴权" vertical="middle" />

#### 可选 URL 参数

| 参数       | 可选值                                           | 备注 |
| -------- | --------------------------------------------- | -- |
| `format` | `surge-policy`, `qx-server`, `clash-provider` |    |
| `filter` | 内置的过滤器或自定义过滤器                                 |    |

定义：

- `surge-policy` Surge 远程节点 Policy
- `qx-server` QuantumultX 远程节点
- `clash-provider` [Clash Provider](https://www.notion.so/New-Feature-Clash-Proxy-Provider-ff8d1955f6234ad3a779fecd3b3ea007)

:::tip 提示
1. `format` 使用的是内置的模板，所以你不需要额外定义模板格式，不过仍然需要定义一个完整的 Artifact。我的建议是定义一个有完整节点的 Artifact，然后根据需要过滤出节点；
2. `filter` 的值为过滤器的名称。你可以直接使用内置的过滤器，例如 `hkFilter`；也可以使用自定义的过滤器，例如 `customFilters.myFilter`；
:::

#### 自定义参数

URL 中的 Query 参数能够传入到模板变量 `customParams` 中，方便用户拓展模板。

比如：

```
https://example.now.sh/get-artifact/Surge.conf?access_token=token&foo=bar
```

那模板变量 `customParams.foo` 值为 `bar`。如果已经在 Artifact 中定义了这个 Key，那预先定义的值将被覆盖。

:::warning 注意
1. URL 参数中的值的类型都是字符串，形如 `true`、`1` 这样的值在模板中是 `"true"` 和 `"1"`；
2. `access_token`, `format`, `filter`, `dl` 为保留 Key 无法被定义；
:::

此外，API 会在 `customParams` 中注入以下变量：

| 变量          | 描述                                        |
| ----------- | ----------------------------------------- |
| `userAgent` | 请求订阅客户端的 user agent。可用于模板中，根据不同客户端输出不同配置。 |

### 直接导出 Provider

```
GET /export-providers
```

<Badge text="需要鉴权" vertical="middle" />

有时候你只想将 Provider 导出成类似 Surge Policy 或者其它格式的配置，那么可以借助这个功能快速达到目的，免去了新建一个 Artifact 的麻烦。即使这个 Provider 没有被任何一个 Artifact 使用，它也是能够被直接导出的！

#### 可选 URL 参数

| 参数         | 可选值                                           | 备注 |
| ---------- | --------------------------------------------- | -- |
| `format`   | `surge-policy`, `qx-server`, `clash-provider` |    |
| `template` | 任意一个 `.tpl` 文件                                |    |
| `filter`   | 内置的过滤器或自定义过滤器                                 |    |

#### 使用内置 `format` 导出

你可以在面板的 Provider 页面找到复制链接按钮。目前面板还不支持复制组装多个 Provider 的 URL。如果你想组装多个 Provider，可以修改 URL 中的 `providers` 参数，多个 Provider 名称以逗号分隔，例如：

```
https://example.com/export-providers?providers=maying,dlercloud&format=surge-policy
```

:::tip 提示
合并多个 Provider 时，第一个 Provider 为主 Provider，遵循过滤器的合并规则。
:::

#### 指定 Template 导出

你可以通过增加 URL 参数 `template` 来制定使用某个 Template 来导出 Provider。值得一提的是，这种方法不需要新定义 Artifact。

:::warning 注意
1. 参数 `template` 和 `format` 不能同时出现；
2. `filter` 的值为过滤器的名称。你可以直接使用内置的过滤器，例如 `hkFilter`；也可以使用自定义的过滤器，例如 `customFilters.myFilter`；
:::

### 直接渲染模板

```
GET /render?template=[template name]
```

有时候我们并不需要将节点和规则完整的渲染出来，而是渲染某个模板。通过这个接口我们可以方便地渲染某个 Template，例如：

```
https://example.com/render?template=static
```

这样 Surgio 就会渲染仓库目录下 _./template/static.tpl_ 的内容。

:::tip 提示
1. 只有 `downloadUrl` 和 `getUrl` 这两个模板变量（方法）有效；
2. 你不可以在这里的模板中引用 `nodeList` 之类的变量，因为根本不会解析节点；
3. 子目录下的模板也是可以直接渲染的；
:::
