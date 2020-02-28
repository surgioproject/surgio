---
sidebarDepth: 2
---

# 托管 API 功能

[[toc]]

:::tip 提示
1. 请先参考 [文档](/guide/advance/api-gateway.md) 搭建托管 API
2. 该文档仅针对 now.sh 类型的部署
:::

## 接口鉴权

### 打开鉴权

在 `surgio.conf.js` 中增加如下字段：

```js
{
  gateway: {
    auth: true,
    accessToken: 'YOUR_PASSWORD',
  },
}
```

### 请求需要鉴权的接口

请在请求的 URL 中加入参数 `access_token`，值为上面所设。

#### 未开启鉴权

```
https://xxxxxx.xxx.now.sh/list-artifact
```

#### 开启鉴权

```
https://xxxxxx.xxx.now.sh/list-artifact?access_token=YOUR_PASSWORD
```

## 接口

### 展示所有 Artifact

```
GET /list-artifact
```

<Badge text="需要鉴权" vertical="middle" />

![](./images/api-gateway-preview.png)

特性：

- 若名称中包含 `surge`（大小写不敏感），则会出现添加到 Surge 的按钮。
- 若名称中包含 `clash`（大小写不敏感），则会出现添加到 ClashX/CFW 的按钮。
- 若项目下的 `package.json` 有 `repository` 字段，则支持直接跳转到 GitLab 或 GitHub 编辑对应文件。

### 下载 Artifact

```
GET /get-artifact/<artifactName>
```

<Badge text="需要鉴权" vertical="middle" />

可选参数：

| 参数       | 可选值                         | 备注 |
| -------- | --------------------------- | -- |
| `format` | `surge-policy`, `qx-server`, `clash-provider` | <Badge text="v1.6.0" vertical="middle" /> |
| `filter` | 内置的过滤器或自定义过滤器               |  <Badge text="v1.6.0" vertical="middle" />  |

定义：

- `surge-policy` Surge 远程节点 Policy
- `qx-server` QuantumultX 远程节点
- `clash-provider` <Badge text="v1.11.0" vertical="middle" /> [Clash Provider](https://www.notion.so/New-Feature-Clash-Proxy-Provider-ff8d1955f6234ad3a779fecd3b3ea007)

:::tip 提示
1. `format` 使用的是内置的模板，所以你不需要额外定义模板格式，不过仍然需要定义一个完整的 Artifact。我的建议是定义一个有完整节点的 Artifact，然后根据需要过滤出节点。
2. `filter` 的值为过滤器的名称。你可以直接使用内置的过滤器，例如 `hkFilter`，也可以使用自定义的过滤器。
:::

### 转换 Quantumult X 远程脚本

```
GET /qx-script?url=<远程脚本地址>
```

<Badge text="即将废弃" vertical="middle" type="error" />

可选参数：

| 参数       | 值                         | 备注 |
| -------- | --------------------------- | -- |
| `id` | 设备 ID |  多个值以半角 `,` 分隔  |

会在脚本内容中注入设备 ID。

使用时，将规则放入 `rewrite_local` 即可。

```
[rewrite_local]
^http://example\.com/resource/ url script-echo-response https://xxx.xx.now.sh/qx-script?url=https://raw.githubusercontent.com/crossutility/Quantumult-X/master/sample-rewrite-with-script.js
```

:::tip 提示
1. 若 URL 中有参数 `id` 则只会添加参数中的值而忽略配置中的值。
2. 你可以在全局配置中添加 [固定的设备 ID](/guide/custom-config.md#quantumultxconfig-deviceids)。
:::

### 转换 Quantumult X rewrite_remote

```
GET /qx-rewrite-remote?url=<远程脚本地址>
```

<Badge text="即将废弃" vertical="middle" type="error" />

可选参数：

| 参数       | 值                         | 备注 |
| -------- | --------------------------- | -- |
| `id` | 设备 ID |  多个值以半角 `,` 分隔  |

以 [这个脚本](https://github.com/NobyDa/Script/blob/master/QuantumultX/Js.conf) 为例，API 会将内容里的 `script-response-body` 条目的脚本地址替换成注入设备 ID API 的地址。

使用时，将规则放入 `rewrite_remote` 即可。

```
[rewrite_remote]
https://xxx.xx.now.sh/qx-rewrite-remote?url=https://raw.githubusercontent.com/NobyDa/Script/master/QuantumultX/Js.conf, tag=NobyDa, enabled=true
```

:::tip 提示
1. 若 URL 中有参数 `id` 则只会添加参数中的值而忽略配置中的值。
2. 你可以在全局配置中添加 [固定的设备 ID](/guide/custom-config.md#quantumultxconfig-deviceids)。
:::
