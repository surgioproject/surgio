# 部署 - Zeabur

[[toc]]

## 准备

确保 `surgio` 升级至 `v2.17.0` 或以上; `@surgio/gateway` 升级至 `v1.5.0` 或以上。

### 开启接口鉴权

:::warning 注意
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api.md#打开鉴权)。

### 增加平台配置

在代码库的根目录新建文件 `gateway.js`，内容如下：

```js
const gateway = require('@surgio/gateway');
const os = require('os');

const PORT = process.env.PORT || 3000;

(async () => {
  const app = await gateway.bootstrapServer();

  await app.listen(PORT, '0.0.0.0');
  console.log(`> Your app is ready at http://0.0.0.0:${PORT}`);
})();
```

参照 [这里](https://github.com/surgioproject/railway-demo/blob/master/package.json) 在 `scripts` 下补充 `start` 脚本。

```json
{
   "start": "node gateway.js"
}
```

### 注册 Zeabur 账号

前往 [Zeabur.com](https://zeabur.com?referralCode=geekdada&utm_source=geekdada&utm_campaign=oss) 注册账号。

## 新建项目

![](/images/zeabur-create-project.png)

选择 __GitHub__ 并且选择你的 Surgio 仓库。这一步可能会需要授权，请根据提示操作即可。

正常情况下 Zeabur 能够自动识别项目的类型和所需的配置，请检查是否如下所示：

![](/images/zeabur-config.png)

:::tip 提示
- `Build Command` 可不存在
- `Node Version` 大于等于 18 即可
- `Start Command` 必须为 `npm start` 或 `yarn start`
:::

## 部署

点击 __部署__ 按钮，即可部署。

## 配置域名

![](/images/zeabur-domain.png)

你可以在这里生成一个 Zeabur 的域名，也可以使用自己的域名。

## 配置 Redis 缓存

:::tip
此步骤可选，推荐配置
:::

推荐直接使用 Zeabur 提供的 Redis 服务。

### 新建 Redis 实例

<video src="/images/zeabur-redis-create.mp4" controls style="width: 100%;" preload="none"></video>

实例创建成功后，Zeabur 会自动将 Redis 的连接信息添加到项目的环境变量中。后面请参考 [Redis 缓存](/guide/advance/redis-cache.md) 进行配置。需要注意的是，Zeabur 注入的环境变量是 `REDIS_URI`。

## 使用

你可能还需要更新 _surgio.conf.js_ 内 `urlBase` 的值，它应该类似：

```
https://surgio-demo.zeabur.app/get-artifact/
```

:::tip 移步至
[托管 API 的功能介绍](/guide/api.md)
:::
