# Gateway authProvider 设计

## 背景

gateway 现在用两个固定字符串鉴权：`accessToken` 拥有 admin 和 viewer 两个角色，`viewerToken` 只有 viewer。订阅用户的身份数据保存在一个外部后端里，每个用户有自己的订阅 key。Surge、Clash 这类客户端只会请求一个固定 URL，所以 key 只能放在 URL 或请求里，由 gateway 拿去向外部后端换取身份。

`authProvider` 让项目把 viewer 身份的判定交给自己的代码，取代 `viewerToken`。admin 机制保持不变。

## 目标

- 新增 `gateway.authProvider`，由它决定一个请求能不能获得 viewer 身份。
- 生成的订阅链接带上当前请求者自己的 token，不同用户拿到的链接各不相同。
- Node、Worker、Lambda 三种部署方式使用同一个函数。

## 非目标

- 不改变 admin 机制。`accessToken`、面板登录、`_t` cookie、`signAccessToken`、`cookieMaxAge` 全部保持现状。
- authProvider 不返回角色，也不能给出 admin。
- gateway 不缓存 authProvider 的结果。需要缓存时由 authProvider 自己实现，好让后端吊销 key 后立即生效。
- 不做按用户限制 artifact 的访问权限。

## 反目标

下面这些情况，即使功能能跑也算失败：

- 某个 viewer 的 token 出现在另一个 viewer 拿到的内容里。
- viewer 请求生成的内容里出现 `accessToken`。
- 外部后端故障时，客户端收到 401，误以为 key 失效。

## 接口

```ts
type GatewayAuthProvider = (input: {
  readonly request: Request
}) => Promise<{ success: true; accessToken: string } | { success: false }>
```

- `request` 是标准 Web `Request`，在 Hono 中对应 `context.req.raw`。token 从哪里取（query、header 或其他位置）完全由 provider 决定。
- `accessToken` 是写进这个用户生成链接里的 token，gateway 会把它放在 `?access_token=` 参数里。
- provider 必须同时接受两种携带方式：`?access_token=` query 参数和 `Authorization: Bearer` header。前者用于 gateway 自己生成的链接；后者用于嵌入页 `/embed/artifact/:name`，前端会把 URL 中的 token 改放进 Bearer header 去调用 `/api/auth/validate-token` 和 `/api/artifacts/:name`。缺少任意一种，对应的入口都会返回 401。这条约束要写进用户文档，示例要同时处理两种方式。签名保持 `{ request }`，前端不需要改动。
- 返回 `{ success: false }` 时，gateway 返回 401。
- provider 抛出异常时，异常交给 gateway 现有的 `onError` 处理，返回 5xx，不当作 401。

配置示例：

```ts
export default defineSurgioProject({
  gateway: {
    auth: true,
    accessToken: env('SURGIO_ACCESS_TOKEN'),
    async authProvider({ request }) {
      const bearer = request.headers
        .get('authorization')
        ?.match(/^Bearer\s+(.+)$/i)?.[1]
      const key =
        bearer ?? new URL(request.url).searchParams.get('access_token')
      if (!key) return { success: false }
      const user = await lookupUser(key)
      return user ? { success: true, accessToken: key } : { success: false }
    },
  },
})
```

## 配置规则

- `authProvider` 和 `viewerToken` 只能二选一，同时配置时加载配置直接报错。
- 配置了 `authProvider`，就必须同时配置 `auth: true` 和 `accessToken`，否则报错。admin 仍然依赖 accessToken；`auth: false` 时所有请求直接放行，authProvider 不会被调用，配了也没有意义。
- Zod schema 只校验 `authProvider` 是函数，不校验它的签名。签名由 TypeScript 类型约束。
- Worker manifest 直接 `import` 项目文件（见 `src/worker/build.ts`），所以函数能原样带到 Worker 里，不需要额外序列化。authProvider 中使用的依赖必须能在 Worker 中运行，这是使用者的责任，需要在文档里说明。

## 鉴权流程

`auth.ts` 中的 `authenticate` 按下面的顺序处理：

1. `auth` 未开启：返回 admin + viewer（现状）。
2. 从 Bearer 或 `?access_token=` 取 token，与 `accessToken` 相等：返回 admin + viewer（现状）。
3. `_t` cookie 有效：返回 admin + viewer（现状）。
4. 配置了 `viewerToken` 且 token 与之相等：返回 viewer（现状）。
5. 配置了 `authProvider`：调用它。`success: true` 时返回 viewer，并带上 provider 返回的 `accessToken` 作为链接 token。
6. 以上都不满足：返回 `undefined`，最终得到 401。

admin 的请求在第 2、3 步就已结束，不会调用外部后端。

`authenticate` 的返回值从 `{ roles }` 扩展为 `{ roles, accessToken? }`。requireRole 中间件把结果存进 Hono context 变量，供后面的路由读取。

## 链接中的 token

现在 `src/runtime/artifact.ts` 用配置里的 `viewerToken ?? accessToken` 生成 `getDownloadUrl`、`getUrl` 和默认的 `downloadUrl`。gateway 的 `/render` 则一直使用 `accessToken`（`app.ts` 的 `addToken`），所以 viewer 访问 `/render` 时也会拿到管理员 token。

改动：

- 在 surgio 核心的 `RenderArtifactOptions`（`src/runtime/public.ts`）中新增 `accessToken?: string`。传入后，它替换 `artifact.ts` 里根据配置计算出的 token；没有传入时保持现有逻辑。`renderProviders` 继承这个字段。
- 只有通过 authProvider 鉴权的 viewer 请求，gateway 才把 provider 返回的 token 传给 runtime。admin 请求（token 或 cookie）和 viewerToken 请求都不传，继续使用核心的 `viewerToken ?? accessToken` 回退。这样没有配置 authProvider 的部署，生成结果和现在完全一致。（设计者决定）
- 对于通过 authProvider 鉴权的 viewer 请求，gateway 在把请求 URL 作为 `downloadUrl` 传给 runtime 之前，会先把其中的 `access_token` 参数改写成 provider 返回的 token；原 URL 没有这个参数时就追加一个。原因是 `downloadUrl` 会被 Surge 的 `#!MANAGED-CONFIG` 用来定期刷新。如果 provider 从 header 读取 token，或者返回的 token 与传入的 key 不同，不改写的话刷新地址里会缺 token 或带错 token。（设计者决定）
- gateway 的 `/render` 中，`getUrl` 的 token 规则和上面相同：authProvider viewer 使用 provider 返回的 token，其他请求使用 `viewerToken ?? accessToken`，不再固定使用 `config.accessToken`。（设计者决定）
- 面板（admin cookie 登录）中显示的订阅链接使用登录者的 token，也就是 `accessToken`。配置了 `viewerToken` 时保持现状，继续显示 viewerToken。

## 缓存隔离

渲染结果中会带上请求者的 token，所以凡是可能被不同请求复用的缓存，key 都必须区分 token：

- 核心的渲染缓存（`src/runtime/cache-key.ts` 的 `buildRenderedArtifactCacheKey`）：新增的 `accessToken` 字段必须加入 key。不能只依赖 `downloadUrl`，因为 provider 可能从 header 取 token，这时 URL 是一样的。
- gateway 的 `useCacheOnError` 兜底缓存（`fallbackCacheKey`）：现在 key 会去掉 `access_token`。对于 authProvider viewer 请求，必须把 provider 返回的 token 加进 key。
- `/render` 现在的响应头是 `s-maxage=86400, stale-while-revalidate`，CDN 会按 URL 缓存。配置了 authProvider 时改为 `private, no-cache, no-store`，避免 provider 从 header 取 token 时 CDN 把一个人的内容发给另一个人。

## `surgio generate`

命令行生成本地文件时没有请求者。配置了 authProvider 时，生成文件中的链接使用 `accessToken`。`artifact.ts` 现有的 `viewerToken ?? accessToken` 回退逻辑已经能得到这个结果，不需要改动，补一个测试即可。

## 前端（gateway-frontend）

- `useDownloadToken` 继续使用 `viewerToken || accessToken`。
- cookie 登录后，前端 store 里没有 accessToken，链接也就没有 token（现状）。配置了 authProvider 时，`/api/auth/validate-*` 的响应需要带回 `accessToken` 作为链接 token。admin 返回配置里的 `accessToken`，authProvider viewer 返回 provider 给出的 token。前端已经处理了 `user.accessToken` 字段，之后用它发 Bearer 请求，也用它拼链接。没有配置 authProvider 时，响应保持现状。
- 嵌入页 `/embed/artifact/:name?access_token=<key>` 对 authProvider viewer 可用，依靠的是 provider 同时支持 Bearer 的约定（见「接口」一节），前端不需要改动。

## 涉及的仓库与文件

- surgio（本仓库）：`src/validators/surgio-config.ts`、`src/config.ts`（两处 gateway 检查）、`src/runtime/public.ts`、`src/runtime/artifact.ts`、`src/runtime/core.ts`、`src/runtime/cache-key.ts`，文档 `docs/guide/custom-config.mdx` 和 `docs/guide/api.mdx`。
- `surgioproject/packages`：`packages/gateway/src/{types.ts,auth.ts,app.ts}`。前端只需要确认 `validate-*` 返回的 `accessToken` 能被用作链接 token。

发布顺序：先发 surgio 核心，再发 gateway。gateway 需要处理核心还没有 `accessToken` 渲染参数的情况，或者把对核心的最低版本要求提高到新版本。

## 留给实现者决定

- `authenticate` 返回结构的具体字段名。
- 配置报错的文案。
- 新增测试的组织方式。至少需要覆盖：二选一报错；admin 请求不调用 provider；provider 返回失败得到 401；provider 抛错得到 5xx；两个 viewer 在核心缓存和兜底缓存中互不串 token；`/render` 不泄露 accessToken；authProvider viewer 能通过 Bearer 打开嵌入页；`downloadUrl` 中的 `access_token` 被改写为 provider 返回的 token；未配置 authProvider 时生成结果与现在一致；`generate` 使用 accessToken。
