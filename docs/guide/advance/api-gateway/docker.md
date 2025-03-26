# 部署 - Docker

[[toc]]

如果你有一定编程经验（会 docker 就行）并且有自己的服务器，也可以选择 docker 的部署方式。

## 准备

在你的服务器上安装 docker。具体的可以参考 [Docker 官方文档](https://docs.docker.com/engine/install/)

### 开启接口鉴权

:::warning 注意
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api.md#打开鉴权)。

## Docker 部署

### 增加 docker 配置

在代码库的根目录新建文件 `Dockerfile`，内容如下：

```dockerfile
FROM node:lts

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 构建镜像

:::tip
下方的 surgio 可以替换为你喜欢的映像名
:::

在项目的根目录运行：

```bash
docker built -t surgio:latest .
```

## 使用

### docker 运行

在任意目录运行：

```bash
docker run --name surgio -p 3000:3000 -d surgio:latest
```

### docker compose

在希望运行的目录创建文件 `compose.yml`
```yaml
name: 'surgio'

services:
  ladder:
    image: surgio:latest
  ports:
    - 3000:3000
```

运行 `docker compose up -d` 即可

### 更新 url

你可能还需要更新 _surgio.conf.js_ 内 `urlBase` 的值，它应该类似：

```
http://你的域名或IP:3000/get-artifact/
```

:::tip 移步至
[托管 API 的功能介绍](/guide/api.md)
:::