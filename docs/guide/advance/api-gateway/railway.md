# 部署 - Railway

[[toc]]

:::tip 提示
1. 该方法要求代码仓库由 GitHub 托管，可为私有仓库
2. 已经部署 Vercel 的项目可以经过简单修改部署至 Railway
3. 已经部署 Heroku 的项目可以直接部署至 Railway
4. 我们有一个运行的示例供你参考：[railway-demo](https://github.com/surgioproject/railway-demo)
:::

## 准备

确保 `surgio` 升级至 `v2.17.0` 或以上; `@surgio/gateway` 升级至 `v1.5.0` 或以上。

### 开启接口鉴权

:::warning 注意
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api.md#打开鉴权)。

### 增加平台配置

在代码库的根目录新建文件 `Procfile`，内容如下：

```
web: npm start
```

继续新建文件 `gateway.js`，内容如下：

```js
const gateway = require('@surgio/gateway')
const PORT = process.env.PORT || 3000

;(async () => {
  const app = await gateway.bootstrapServer()
  await app.listen(PORT, '0.0.0.0')
  console.log('> Your app is ready at http://0.0.0.0:' + PORT)
})()
```

参照 [这里](https://github.com/surgioproject/railway-demo/blob/master/package.json) 在 `scripts` 下补充 `start` 脚本。

```json
{
   "start": "node gateway.js"
}
```

前往 [Railway.app](https://railway.app?referralCode=tN8cxr) 注册账号，可以不绑定信用卡。

## 新建项目

打开 [Railway.app](https://railway.app?referralCode=tN8cxr)，在 Dashboard 中选择新建项目。

![](/images/railway-11.png)

选择从代码仓库部署。

![](/images/railway-12.png)

随后在项目列表中找到代码库，选择用于部署的分支，点击部署。部署成功后即可使用默认分配的域名访问 Surgio 面板。

今后代码库的分支有更新 Railway 会自动拉取并部署。和 Vercel 不同的是，Railway 属于容器化方案，因此打包编译的时间会比 Vercel 久很多。

![](/images/railway-13.png)

:::tip 不要忘记！
请不要忘记将 `surgio.conf.js` 中 `urlBase` 改为 Railway 的域名路径。
:::

## 配置项目

下面的内容属于自定义范畴，可跳过。如果你没有一定基础建议跳过。

### 自定义域名

![](/images/railway-21.png)

### 修改环境变量

需要注意的是，每次增删环境变量都会触发打包编译，如果一次性要添加很多环境变量建议使用 **Bulk Import**。

![](/images/railway-22.png)

## 配置 Redis 缓存

:::tip 此步骤可选，推荐配置
[教程](/guide/advance/redis-cache.md)
:::

## 查看用量

Railway 每月有 5 刀的免费用量，足够单个 Surgio 项目使用。你可以在 [这里](https://railway.app/account/billing) 查看本月的用量。

## 使用

你可能还需要更新 _surgio.conf.js_ 内 `urlBase` 的值，它应该类似：

```
https://surgio-demo.railway.app/get-artifact/
```

:::tip 移步至
[托管 API 的功能介绍](/guide/api.md)
:::