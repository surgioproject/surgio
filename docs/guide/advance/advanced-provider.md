---
title: 编写更复杂的自定义 Provider
sidebarDepth: 2
---

# 编写更复杂的自定义 Provider

[[toc]]

## 介绍

我们在 Provider 的指南中已经介绍了如何编写一个简单的自定义 Provider，并且提到了可以利用异步函数获取节点信息。异步函数可以极大地多样化我们编排节点的方式，这篇文章会例举几个我认为比较有用的例子。需要注意的是，这篇文章都是配合面板使用的。

## 准备工作

在开始之前，我想先介绍一些我们在 Surgio v3 中新增的一些功能，这些功能可能会在下面的例子中用到。

1. 请求订阅的客户端 UserAgent 会暴露在异步函数的 `customParams` 中，你可以通过 `customParams.requestUserAgent` 来获取
2. 请求订阅的 URL 参数会暴露在异步函数的 `customParams` 中，你可以通过 `customParams.xxx` 来获取（它们的值都是字符串）
3. Surgio 内置了 `httpClient` 工具方法，`httpClient` 是一个 [Got](https://github.com/sindresorhus/got) 实例，你可以使用它来发起 HTTP 请求
4. Surgio 内置了一些判断客户端 UserAgent 的工具方法（v3.2.0 新增）

## 例子 🌰

### 动态上下线节点

**情境：** 我有两台国内用于转发的小鸡，它们的流量不多，每个月我都要人工修改节点的域名和端口来切换不同的转发小鸡，我想用一个更简单的方式来动态切换他们。

**思路：** [Flagsmith](https://www.flagsmith.com/) 是一个免费的 Feature Flag 服务，我们可以在 Flagsmith 上创建一个名为 `china` 的 Feature Flag，然后使用不同的值来对应不同的小鸡，例如 `china=1` 对应小鸡 A，`china=2` 对应小鸡 B。然后我们在 Provider 中使用异步函数来获取节点列表，根据 `china` 的值来切换节点的域名和端口。

**实现：**

我们先来看一下 Provider 的配置：

```js
const { utils, defineCustomProvider } = require('surgio');
const Flagsmith = require('flagsmith-nodejs');

const flagsmith = new Flagsmith({
  environmentKey: 'put_your_environment_key_here',
});

module.exports = defineCustomProvider({
  nodeList: async () => {
    const flags = await flagsmith.getEnvironmentFlags();
    const china = flags.getFeatureValue('china');
    
    if (china === '1') {
      return [
        {
          nodeName: '香港节点',
          type: 'shadowsocks',
          hostname: 'a.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'put_your_password_here',
        },
      ];
    } else {
      // 默认返回 b.com
      return [
        {
          nodeName: '香港节点',
          type: 'shadowsocks',
          hostname: 'b.com',
          port: 443,
          method: 'chacha20-ietf-poly1305',
          password: 'put_your_password_here',
        },
      ];
    }
  },
})
```

因为节点的名称没有变化，所以客户端自动更新订阅之后不会因为名称不一致而选中别的节点。 今后，我只需要在 Flagsmith 上修改 `china` 的值，就能够动态切换节点了。

### 根据客户端 UserAgent 动态切换节点

**情境：** 我同时部署了 Hysteria 和 Shadowsocks，我想在 TF 版本的 Surge 中使用 Hysteria，而在其他版本的 Surge 中使用 Shadowsocks。

**思路：** 我们可以利用客户端 UserAgent 来判断客户端的 Surge 版本，然后根据 Surge 版本来切换节点。

**实现：**

我们先来看一下 Provider 的配置：

```js
const { utils, defineCustomProvider } = require('surgio');

module.exports = defineCustomProvider({
  nodeList: async (customParams) => {
    const useragent = customParams.requestUserAgent;
    const isHysteriaSupported = utils.isSurgeIOS(useragent, '>=2920')
    
    return [
      isHysteriaSupported ? {
        nodeName: '香港节点',
        type: 'hysteria2',
        hostname: 'a.com',
        port: 443,
        password: 'put_your_password_here',
      } : {
        nodeName: '香港节点',
        type: 'shadowsocks',
        hostname: 'a.com',
        port: 8443,
        method: 'chacha20-ietf-poly1305',
        password: 'put_your_password_here',
      },
      {
        nodeName: '美国节点',
        type: 'shadowsocks',
        hostname: 'b.com',
        port: 8443,
        method: 'chacha20-ietf-poly1305',
        password: 'put_your_password_here',
      }
    ]
  }
})
```

这样写的 Provider 在本地生成时没有 `requestUserAgent`， `isHysteriaSupported` 是 `false` 所以不会报错。

以下是所有用于判断客户端 UserAgent 的工具方法：

```js
utils.isSurgeIOS(useragent)
utils.isSurgeMac(useragent)
utils.isClash(useragent)
utils.isStash(useragent)
utils.isQuantumultX(useragent)
utils.isShadowrocket(useragent)
utils.isLoon(useragent)
```

这些方法都支持第二个参数来判断版本号，例如 `utils.isSurgeIOS(useragent, '>=2920')`。正确的判断语法有：

- `>=2920`
- `>2920`
- `<=2920`
- `<2920`
- `=2920`

需要注意的是，有的客户端实际在 UserAgent 中使用的版本号并非形如 `1.2.3` 的格式，而是形如 `2490` 这样的格式。请在软件的设置页查看真实的版本号。下面是一些常见客户端的版本号格式：

- Surge: 1000
- Stash: 1.2.3
- Clash: 1.2.3（原版 Clash 不传版本号）
- Loon: 1000
- Quantumult X: 1.2.3
- Shadowrocket: 1000

### 根据 URL 参数动态切换节点

**情境：** 我分享了我的订阅地址给朋友一起用，但是我不想把我用来打游戏的节点也分享给他们。

**思路：** 我不想弄得很复杂，只需要在 URL 中增加一个参数来开启游戏的节点。

**实现：**

```js
const { utils, defineCustomProvider } = require('surgio');

module.exports = defineCustomProvider({
  nodeList: async (customParams) => {
    const isGame = customParams.game === '1';

    const nodeList = [
      isGame ? {
        nodeName: '香港节点',
        type: 'hysteria2',
        hostname: 'a.com',
        port: 443,
        password: 'put_your_password_here',
      } : undefined,
      {
        nodeName: '美国节点',
        type: 'shadowsocks',
        hostname: 'b.com',
        port: 8443,
        method: 'chacha20-ietf-poly1305',
        password: 'put_your_password_here',
      }
    ]

    return nodeList.filter(Boolean); // 不要忘了这一行过滤 undefined
  }
})
```

下面的两个订阅地址分别对应开启和关闭游戏节点：

- https://surgioapi.com/get-artifact/my-provider?game=1 - 有游戏节点
- https://surgioapi.com/get-artifact/my-provider - 没有游戏节点
- 本地生成 - 没有游戏节点
