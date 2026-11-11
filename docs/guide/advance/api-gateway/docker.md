# 部署 - Docker

如果你有一定编程经验（会 Docker 以及基本的运维操作）并且有自己的服务器，也可以选择 Docker 的部署方式。

## 准备

在你的服务器上安装 Docker。具体的可以参考 [Docker 官方文档](https://docs.docker.com/engine/install/)

确保仓库已经迁移为 `surgio.project.ts`，然后安装 Gateway：

```bash
pnpm add surgio @surgio/gateway
```

### 开启接口鉴权

:::warning[注意]
不建议关闭鉴权！
:::

请阅读 [这里](/guide/api#打开鉴权)。

### 增加启动入口

在代码库的根目录新建文件 `server.ts`，内容如下：

```ts
import { startServer } from '@surgio/gateway/node'

await startServer({
  hostname: '0.0.0.0',
  port: Number(process.env.PORT) || 3000,
})
```

`startServer()` 默认只监听 `127.0.0.1`，在容器中必须改为 `0.0.0.0`。

## Docker 部署

### 增加 Docker 配置

在代码库的根目录新建文件 `Dockerfile`，内容如下：

```dockerfile
FROM node:24-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --prod

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.ts"]
```

`pnpm-workspace.yaml` 中的 pnpm 设置会影响安装结果，例如为刚发布的版本添加的
`minimumReleaseAgeExclude`，所以要和 lockfile 一起复制。

再新建 `.dockerignore`，避免把本地依赖、生成结果和凭据复制进镜像：

```text
node_modules
dist
.surgio
.env*
```

### 构建镜像

:::tip[下方的 surgio 可以替换为你喜欢的映像名]
:::

在项目的根目录运行：

```bash
docker build -t surgio:latest .
```

## 使用

### Docker 运行

在任意目录运行：

```bash
docker run --name surgio -p 3000:3000 -d surgio:latest
```

如果 `surgio.project.ts` 通过 `env()` 读取了订阅地址等变量，用 `-e` 传入，例如
`-e DEMO_SUBSCRIPTION_URL=https://example.com/subscription`，或者用 `--env-file` 读取
一个不提交到 Git 的文件。

### Docker Compose

在希望运行的目录创建文件 `compose.yml`

```yaml
name: 'surgio'

services:
  surgio:
    image: surgio:latest
    ports:
      - 3000:3000
    env_file:
      - .env
```

没有需要传入的变量时可以删除 `env_file`。运行 `docker compose up -d` 即可。

## 在公开网络中使用

:::warning[注意]
为了你自己的服务器安全，在公开网络（所有人都可能会访问到的情况下）中请勿使用 `IP:端口` 的方式进行访问。

另外，请为自己的服务器申请证书并通过后端代理进行 HTTPS 访问。
:::

以下提供了简单的反向代理配置，更复杂的请自行研究。

### 如果你有 Traefik 部署

那么你的 `compose.yml` 文件可以按以下方式编写：

```yaml
name: 'surgio'

services:
  surgio:
    image: surgio:latest
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.surgio.rule=Host(`你的域名`)
      - traefik.http.routers.surgio.tls=true
    networks:
      - traefik
```

### 如果你有 Nginx

可以在你的站点配置下新增 `surgio.conf`：

```text
server {
    listen 80;
    server_name 你的域名;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

然后重新加载 Nginx 配置

```bash
sudo nginx -s reload
```

### 更新 url

你可能还需要更新 `surgio.project.ts` 内 `urlBase` 的值，它应该类似：

```text
https://你的域名/get-artifact/
```

:::tip[移步至]
[托管 API 的功能介绍](/guide/api)
:::
