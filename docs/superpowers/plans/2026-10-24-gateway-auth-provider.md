# Gateway authProvider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `gateway.authProvider`，作为 `viewerToken` 的替代：由项目代码判断请求能否获得 viewer 身份，生成链接带上请求者自己的 token。

**Architecture:** surgio 核心负责配置校验、渲染参数 `accessToken` 和渲染缓存 key。`@surgio/gateway` 负责调用 authProvider、把链接 token 传给 runtime、改写 `downloadUrl` 并隔离兜底缓存。两个仓库各开一个分支，先完成并发布核心，再改 gateway。

**Tech Stack:** TypeScript、Zod（`zod/v3`）、Vitest、Hono。

**Spec:** `docs/superpowers/specs/2026-10-24-gateway-auth-provider-design.md`（surgio 仓库）

## Global Constraints

- 仓库：核心在 `/Users/yihang/Development/projj/github.com/geekdada/surgio`，gateway 在 `/Users/yihang/Development/projj/github.com/surgioproject/packages/packages/gateway`。两个仓库都在 `feat/gateway-auth-provider` 分支上工作，不直接提交到 master。
- 签名固定为 `({ request }: { readonly request: Request }) => Promise<{ success: true; accessToken: string } | { success: false }>`。
- `authProvider` 和 `viewerToken` 只能二选一；配置 `authProvider` 时必须同时配置 `auth: true` 和 `accessToken`。
- admin 机制（`accessToken`、`_t` cookie、`signAccessToken`、`cookieMaxAge`、`/api/auth`）不做任何改动。
- 没有配置 authProvider 的部署，生成结果、缓存 key 和响应头都必须与现在一致。
- 链接 token 统一使用 `access_token` query 参数名。
- provider 抛出的异常必须交给 `onError` 处理，返回 5xx，不能转成 401。
- Worker 依赖图不得新增 Node-only 模块（AGENTS.md）。
- 用户可见的报错文案使用中文，和现有风格保持一致。

## Review Focus

1. provider 返回 `{ success: true, accessToken: '' }`：链接里会缺 token，应当按失败处理，返回 401。测试放在 Task 3。
2. provider 忘了 `return`，resolve 出 `undefined` 或其他非预期值：应当返回 401，不能因为解构报错变成 500。测试放在 Task 3。
3. provider 返回的 `accessToken` 等于 `gateway.accessToken`：viewer 的内容里会出现管理员 token，违反反目标，应当拒绝并返回 5xx。测试放在 Task 3。
4. provider 返回的 token 含有 `+`、`&`、`=`：改写后的 `downloadUrl` 必须正确编码，再次解析后得到原值。测试放在 Task 4。
5. 配置了 authProvider、没有 viewerToken 时，admin 通过 cookie 访问 `/render`：`getUrl` 应当使用 `accessToken`，不能不带 token。测试放在 Task 4。

---

### Task 1: 核心配置校验与文档

**Files:**
- Modify: `src/validators/surgio-config.ts:141-155`（gateway schema）
- Modify: `src/runtime/public.ts:75-86`（`ArtifactRuntimeGatewayConfig`）
- Modify: `src/index.ts`（导出类型）
- Modify: `docs/guide/custom-config.mdx`（`gateway.viewerToken` 之后）、`docs/guide/api.mdx`（鉴权一节）
- Test: `src/validators/surgio-config.test.ts`

**Interfaces:**
- Produces: `src/runtime/public.ts` 中的
  ```ts
  export type GatewayAuthResult = { readonly success: true; readonly accessToken: string } | { readonly success: false }
  export type GatewayAuthProvider = (input: { readonly request: Request }) => Promise<GatewayAuthResult>
  ```
  `ArtifactRuntimeGatewayConfig.authProvider?: GatewayAuthProvider`。两个类型都从 `src/index.ts` 以 type 形式导出。

- [ ] **Step 0: 在两个仓库创建分支并提交 spec**

```bash
git -C /Users/yihang/Development/projj/github.com/geekdada/surgio switch -c feat/gateway-auth-provider
git -C /Users/yihang/Development/projj/github.com/surgioproject/packages switch -c feat/gateway-auth-provider
cd /Users/yihang/Development/projj/github.com/geekdada/surgio
git add docs/superpowers && git commit -m "docs: add gateway authProvider design and plan"
```

- [ ] **Step 1: 写失败测试**

```ts
const authProvider = async () => ({ success: false as const })

test('gateway.authProvider 保留函数引用', () => {
  const parsed = SurgioConfigValidator.parse({
    artifacts: [],
    gateway: { auth: true, accessToken: 'admin', authProvider },
  })
  expect(parsed.gateway?.authProvider).toBe(authProvider)
})

test.each([
  [{ auth: true, accessToken: 'admin', viewerToken: 'v', authProvider }, 'authProvider 与 viewerToken 不能同时配置'],
  [{ accessToken: 'admin', authProvider }, 'authProvider 需要同时开启 gateway.auth'],
  [{ auth: true, authProvider }, 'authProvider 需要同时配置 gateway.accessToken'],
])('gateway.authProvider 配置约束 %#', (gateway, message) => {
  expect(() => SurgioConfigValidator.parse({ artifacts: [], gateway })).toThrow(message)
})

test('gateway.authProvider 必须是函数', () => {
  expect(() =>
    SurgioConfigValidator.parse({
      artifacts: [],
      gateway: { auth: true, accessToken: 'admin', authProvider: 'nope' },
    }),
  ).toThrow()
})
```

- [ ] **Step 2: 确认测试失败**

Run: `pnpm vitest run src/validators/surgio-config.test.ts`
Expected: 新增的 5 个用例失败，`authProvider` 被 Zod 剥离，约束检查不存在。

- [ ] **Step 3: 实现**

在 gateway schema 中加入 `authProvider: z.custom<GatewayAuthProvider>((value) => typeof value === 'function').optional()`。不要使用 `z.function()`，它在 v3 中会把函数包一层，函数引用就变了。写法参考同文件的 `RegexValidatior`。三条约束用 `.superRefine` 实现，文案与 Step 1 一致。按 Interfaces 定义并导出两个类型。

- [ ] **Step 4: 确认测试通过，并跑类型检查**

Run: `pnpm vitest run src/validators/surgio-config.test.ts && pnpm test:types`
Expected: PASS，无类型错误。

- [ ] **Step 5: 更新文档**

在 `custom-config.mdx` 中新增 `### gateway.authProvider` 小节：说明类型、和 viewerToken 二选一、依赖 `auth` 和 `accessToken`、provider 必须同时支持 `?access_token=` 和 `Authorization: Bearer`、抛异常时返回 5xx、gateway 不缓存结果、代码中的依赖需要能在 Worker 中运行、`surgio generate` 使用 accessToken。示例使用 spec「接口」一节的配置示例。在 `api.mdx` 的鉴权段落补一句：配置了 authProvider 时，每个用户使用自己的 key 调用 viewer 接口。

- [ ] **Step 6: 提交**

```bash
git add src/validators src/runtime/public.ts src/index.ts docs/guide
git commit -m "feat(gateway): add authProvider config"
```

### Task 2: 核心渲染参数 `accessToken` 与缓存 key

**Files:**
- Modify: `src/runtime/public.ts:24-30`（`RenderArtifactOptions`）
- Modify: `src/runtime/artifact.ts:276-372`（`createArtifactRenderContext`）
- Modify: `src/runtime/core.ts:180-205`（`renderFresh` 传参）
- Modify: `src/runtime/cache-key.ts`（payload）
- Test: `src/runtime/cache-key.test.ts`、`src/generator/__tests__/json-template.test.ts`（这里已经有 `createArtifactRenderContext` 的构造方式可以参考）

**Interfaces:**
- Consumes: Task 1 的 `ArtifactRuntimeGatewayConfig.authProvider`
- Produces: `RenderArtifactOptions.accessToken?: string`（`RenderProvidersOptions` 继承）；`createArtifactRenderContext` 的 options 新增 `readonly accessToken?: string`

- [ ] **Step 1: 写失败测试**

`cache-key.test.ts`：

```ts
test('accessToken 参与缓存 key', () => {
  expect(keyOf({ accessToken: 'user-a' })).not.toBe(keyOf({ accessToken: 'user-b' }))
  expect(keyOf({})).toBe(keyOf({ accessToken: undefined }))
})
```

`json-template.test.ts` 新增一个 helper，按现有 `extendRoute with getSingboxRules` 用例的参数构造 context，并允许覆盖 `config.gateway` 和 `accessToken`：

```ts
test('渲染参数 accessToken 优先于配置 token', () => {
  const ctx = buildContext({ gateway: { accessToken: 'admin', viewerToken: 'viewer' }, accessToken: 'user-a' })
  expect(ctx.getDownloadUrl('a.conf')).toContain('access_token=user-a')
  expect(ctx.getUrl('/x')).toContain('access_token=user-a')
  expect(ctx.downloadUrl).toContain('access_token=user-a')
})

test('未传 accessToken 时保持 viewerToken ?? accessToken', () => {
  expect(buildContext({ gateway: { accessToken: 'admin', viewerToken: 'viewer' } }).getDownloadUrl('a.conf')).toContain('access_token=viewer')
})

test('配置 authProvider 时 generate 使用 accessToken', () => {
  const ctx = buildContext({ gateway: { auth: true, accessToken: 'admin', authProvider: async () => ({ success: false }) } })
  expect(ctx.getDownloadUrl('a.conf')).toContain('access_token=admin')
})
```

- [ ] **Step 2: 确认测试失败**

Run: `pnpm vitest run src/runtime/cache-key.test.ts src/generator/__tests__/json-template.test.ts`
Expected: 前两个新增用例失败，第三个用例本来就通过。第三个是回归保护，按 spec 现有逻辑已经满足。

- [ ] **Step 3: 实现**

`artifact.ts:347` 改为 `accessToken ?? config.gateway?.viewerToken ?? config.gateway?.accessToken`。`core.ts` 把 `renderOptions.accessToken` 传给 `createArtifactRenderContext`。`cache-key.ts` 把 `accessToken: options.accessToken` 放进 payload。字段为 undefined 时 `JSON.stringify` 会省略它，所以没有 token 时 key 和现在相同。

- [ ] **Step 4: 确认通过，并跑完整单测**

Run: `pnpm test:unit && pnpm test:types && pnpm test:lint`
Expected: 全部 PASS。`node.test.ts` 中「渲染缓存的条目数由配置决定」等已有缓存测试不受影响。

- [ ] **Step 5: 提交**

```bash
git add src/runtime src/generator/__tests__/json-template.test.ts
git commit -m "feat(runtime): accept per-request gateway access token"
```

### Task 3: gateway 鉴权调用 authProvider

**Files:**
- Modify: `packages/gateway/src/types.ts`（`GatewayConfig`、新类型）
- Modify: `packages/gateway/src/auth.ts:22-36`（`authenticate`）
- Modify: `packages/gateway/src/app.ts:131-141`（`requireRole` 存 context 变量）
- Test: `packages/gateway/src/app.spec.ts`

**Interfaces:**
- Consumes: 与 Task 1 同形状的类型，在 gateway 的 `types.ts` 中重新声明（gateway 不从 surgio 导入类型，沿用现有做法）：`GatewayAuthResult`、`GatewayAuthProvider`，以及 `GatewayConfig.authProvider?: GatewayAuthProvider`
- Produces: `authenticate(context, config): Promise<GatewayUser | undefined>`，其中 `interface GatewayUser { readonly roles: ReadonlyArray<GatewayRole>; readonly linkToken?: string }`。`linkToken` 只在 authProvider 成功时存在。`createGatewayApp` 的 Hono 泛型增加 `Variables: { user: GatewayUser }`，`requireRole` 执行 `context.set('user', user)`

- [ ] **Step 1: 写失败测试**

在 `app.spec.ts` 中加一个 `describe('authProvider')`，fixture 使用 `createFixture({ viewerToken: undefined, authProvider })`，`authProvider` 是 `vi.fn`。用例如下：

```ts
test('admin token 与 cookie 不调用 provider')           // Bearer admin-token 和登录 cookie 访问 /get-artifact 均 200，authProvider 未被调用
test('provider 成功时获得 viewer 角色')                // 返回 { success: true, accessToken: 'user-a' }：/get-artifact 200，/api/providers 403
test('provider 失败时返回 401')                        // { success: false } → 401
test('provider 抛错时返回 500')                        // mockRejectedValue(new Error('backend down')) → 500，不是 401
test('provider 收到原始 Request')                      // 调用参数 request.url 含 access_token=k，request.headers.get('authorization') 可读
test('success 但 accessToken 为空串时返回 401')        // Review Focus 1
test('provider resolve undefined 时返回 401')          // Review Focus 2
test('provider 返回 gateway.accessToken 时返回 500')   // Review Focus 3
```

- [ ] **Step 2: 确认测试失败**

Run: `pnpm --filter @surgio/gateway vitest run src/app.spec.ts`
Expected: 新增用例失败，provider 从未被调用，请求返回 401。

- [ ] **Step 3: 实现**

按 spec「鉴权流程」第 1 到 6 步的顺序实现 `authenticate`。provider 的结果按下面的规则处理：
- 结果不是对象，或者不是 `success === true` 且 `accessToken` 为非空字符串：返回 `undefined`。
- `accessToken === config.accessToken`：抛出 `new Error('authProvider 不能返回 gateway.accessToken')`。
- provider 自身的异常不捕获，交给 `onError`。

- [ ] **Step 4: 确认通过**

Run: `pnpm --filter @surgio/gateway vitest run`
Expected: 全部 PASS，包括原有的 `implements login, cookie, bearer, query token and roles`。

- [ ] **Step 5: 提交**

```bash
git add packages/gateway/src
git commit -m "feat(gateway): resolve viewer identity via authProvider"
```

### Task 4: gateway 路由使用链接 token

**Files:**
- Modify: `packages/gateway/src/app.ts`：`publicRequestUrl`（:71）、`/get-artifact`（:168-232）、`/export-providers`（:235-300）、`/render`（:315-340）、`validate`（:404-421）
- Modify: `packages/gateway/package.json`（`surgio` 依赖下限改为包含 Task 2 的版本）
- Test: `packages/gateway/src/app.spec.ts`

**Interfaces:**
- Consumes: Task 3 的 `context.get('user'): GatewayUser`；Task 2 的渲染参数 `accessToken`
- Produces: `publicRequestUrl(requestUrl: string, publicUrl: string, linkToken?: string): string`。传入 `linkToken` 时，`access_token` 被 set 为该值

- [ ] **Step 1: 写失败测试**

继续在 `describe('authProvider')` 中添加。provider 返回 `{ success: true, accessToken: 'user-a' }`，另一个用例返回 `'user-b'`：

```ts
test('get-artifact 把链接 token 传给 runtime 并改写 downloadUrl')
// 请求 /get-artifact/demo.conf?access_token=k&foo=1
// expect(runtime.renderArtifact).toHaveBeenCalledWith('demo.conf', expect.objectContaining({ accessToken: 'user-a' }))
// new URL(options.downloadUrl).searchParams.get('access_token') === 'user-a'，foo=1 保留

test('provider 从 header 取 token 时 downloadUrl 也带上 access_token')
// 只发 Authorization: Bearer k，不带 query → downloadUrl 的 access_token === 'user-a'

test('链接 token 中的特殊字符被正确编码')               // Review Focus 4：provider 返回 'a+b&c=d'，searchParams.get 得到原值

test('export-providers 传递 accessToken')

test('两个 viewer 的兜底缓存互不串用')
// user-a 渲染成功后写入缓存；renderArtifact 改为 reject，再用 user-b 请求同一 URL（除 access_token 外相同）→ 不命中 user-a 的缓存（无 x-use-cache，返回 500）

test('/render 的 getUrl 使用 viewer 自己的 token，且响应为 private')
// runtime.renderTemplate 捕获 context.getUrl('/x') → 含 access_token=user-a，不含 admin-token
// cache-control === 'private, no-cache, no-store'

test('cookie 登录的 admin 访问 /render 时 getUrl 使用 accessToken')   // Review Focus 5

test('validate-token 返回链接 token')
// viewer → data.accessToken === 'user-a'；admin Bearer → data.accessToken === 'admin-token'；cookie 登录 → 'admin-token'
```

在默认 fixture（配置 viewerToken、没有 authProvider）下补两个回归用例：

```ts
test('未配置 authProvider 时不向 runtime 传 accessToken，downloadUrl 不改写')
test('未配置 authProvider 时 /render 的 getUrl 使用 viewerToken，响应头保持 s-maxage')
```

第二个用例修复的是 spec 中提到的 `/render` 泄露：原来这里固定使用 `config.accessToken`。

- [ ] **Step 2: 确认测试失败**

Run: `pnpm --filter @surgio/gateway vitest run src/app.spec.ts`
Expected: 新增用例失败。

- [ ] **Step 3: 实现**

- `/get-artifact` 和 `/export-providers`：读取 `context.get('user').linkToken`，存在时传入 `accessToken`，并用它调用 `publicRequestUrl`。
- `fallbackCacheKey` 的 parts：仅当 `linkToken` 存在时追加。这样未配置 authProvider 的部署，缓存 key 不变。
- `/render`：`getUrl` 的 token 取 `linkToken ?? config.viewerToken ?? config.accessToken`；配置了 `authProvider` 时响应头改用 `textHeaders` 的 cache-control。
- `validate`：配置了 `authProvider` 时，响应的 `data.accessToken` 取 `user.linkToken ?? config.accessToken`；未配置时响应保持现状。

- [ ] **Step 4: 确认通过，并跑完整检查**

Run: `pnpm --filter @surgio/gateway test:unit && pnpm --filter @surgio/gateway lint`（以 `package.json` 中实际的 lint 脚本名为准）
Expected: 全部 PASS。

- [ ] **Step 5: 用前端手动验证嵌入页**

用本地 gateway 配置一个 provider：同时接受 query 和 Bearer，key 为 `k` 时返回 `user-a`。打开 `/embed/artifact/demo.conf?access_token=k`。
Expected: 卡片正常加载，下载链接中是 `access_token=user-a`，页面没有跳转到 logout。

- [ ] **Step 6: 提交**

```bash
git add packages/gateway
git commit -m "feat(gateway): render links with the requester's token"
```
