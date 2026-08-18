# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## 项目简介

Surgio 是一个用于生成代理工具配置文件的 Node.js 命令行工具，支持 Surge、Clash、Quantumult X、sing-box 等多种代理客户端。项目使用 TypeScript 编写，基于 oclif 框架构建 CLI 工具。

## 常用命令

### 开发相关

```bash
# 开发模式 (构建并监听文件变化)
pnpm dev

# 构建项目
pnpm build

# 清理构建文件
pnpm clean

# 准备发布 (清理 + 构建)
pnpm prepublishOnly
```

### 测试相关

```bash
# 运行所有测试
pnpm test

# 运行类型检查
pnpm test:types

# 运行 ESLint 检查
pnpm test:lint

# 运行单元测试 (使用 Vitest)
pnpm test:unit

# 运行单个测试文件
pnpm vitest run src/path/to/test.test.ts

# 运行 CLI 测试 (使用 Vitest)
pnpm test:cli

# 更新 CLI 测试快照
pnpm test:cli:update

# 运行测试覆盖率
pnpm coverage

# 在真实 workerd 环境中运行 Worker 集成测试
pnpm test:worker

# 生成 Worker manifest
pnpm worker:manifest

# 检查 Wrangler 生产构建
pnpm worker:dry-run
```

### 文档相关

```bash
# 开发模式启动文档站点
pnpm docs:dev

# 构建文档站点
pnpm docs:build
```

### 其他

```bash
# 运行示例
pnpm run-example

# 生成变更日志
pnpm changelog

# 发布新版本
pnpm release

# 发布 beta 版本
pnpm release:beta
```

## 高层架构

### 核心架构概览

```
surgio/
├── src/                    # 源代码目录
│   ├── commands/          # CLI 命令实现 (基于 oclif)
│   ├── provider/          # 数据提供者 (支持各种订阅格式)
│   ├── project/           # 统一 Project 定义、secret 引用与 Node loader
│   ├── generator/         # Node 侧 Artifact 与模板适配器
│   ├── runtime/           # 平台无关的执行核心与 Renderer 接口
│   ├── worker/            # Worker manifest、运行时与预编译模板适配器
│   ├── cache/             # TtlCache、KvStore 及平台存储适配器
│   ├── utils/             # 工具函数集合
│   ├── filters/           # 节点过滤器
│   ├── validators/        # 数据验证器 (基于 zod)
│   └── constant/          # 常量定义
├── docs/                  # 文档站点源码 (vuepress)
├── examples/              # 使用示例
└── test/                  # 测试文件
```

### 关键架构概念

#### 统一 Project 与 Runtime

- 新项目默认使用唯一的 ESM `surgio.project.ts`，通过 Node 原生 TypeScript type stripping 运行；`defineSurgioProject` 的 Surgio 配置字段直接位于顶层，`providers` 和 `templateDir` 作为 Project 元数据；`.mts`、`.mjs`、`.js` 仍作为兼容入口
- Project loader 必须先剥离 `providers` 和 `templateDir` 再校验业务配置；Node loaded project 和 Worker manifest 内部仍可使用 `{ config, providers }` 投影，不得把 Provider registry 送入 Zod 配置校验
- 独立 TypeScript 配置对象使用 `satisfies SurgioProjectConfig`；不要增加只返回输入值的配置 identity helper，legacy JavaScript 直接导出普通对象
- Node-only 的 output、cache 和 upload 放在具名导出的 `nodeOptions()`；Worker manifest 构建不得导入或序列化 `nodeOptions`
- CLI 优先加载唯一的 `surgio.project.ts | .mts | .mjs | .js`，仅在 Project 入口不存在时兼容 `surgio.conf.js + provider/`；多个 Project 入口或新旧入口并存必须报错
- `env(name)` 是读取字符串环境变量的唯一语法糖，缺失时抛错；不要重新引入特殊 secret 标记、递归配置替换或专用 resolver
- Worker 依靠 `nodejs_compat` 将文本变量和 Secrets 暴露给 `process.env`；KV、Assets 等结构化 binding 仍由平台 adapter 显式注入
- Node 与 Worker 分别通过 `createNodeSurgioRuntime` 和 `createSurgioRuntime` 实现同一个 `SurgioRuntime` 接口；调用方不得依赖 `Artifact`、Provider 目录或模板 engine 内部对象
- Gateway 只消费 `SurgioRuntime`。HTTP 路由位于独立的 `@surgio/gateway` Hono 模块，Node、Worker 和 Lambda 只负责平台 adapter

#### Provider 系统

- Provider 是数据来源的抽象，负责从各种格式的订阅源获取节点数据
- 支持多种协议：Shadowsocks、ShadowsocksR、V2Ray、Trojan、Clash 等
- 主要 Provider 类型：
  - `ClashProvider`: 解析 Clash 格式订阅
  - `ShadowsocksSubscribeProvider`: 解析标准 SS 订阅
  - `V2rayNSubscribeProvider`: 解析 V2rayN 格式订阅
  - `CustomProvider`: 自定义节点定义

#### Generator/Artifact 与统一渲染层

- `Artifact` 负责组合 Provider 数据和模板，但不直接持有或操作 Nunjucks engine
- 统一渲染边界位于 `src/runtime/renderer.ts`，公开的 `Renderer` 只提供 `renderArtifact` 和 `renderTemplate`
- Node 适配器 `createNodeRenderer` 位于 `src/generator/template.ts`，负责文件模板、内联模板、JSON 模板、filters 和 globals
- Worker 适配器 `createPrecompiledRenderer` 位于 `src/worker/template-engine.ts`，只消费 manifest 中的预编译模板和 JSON 资源
- `.tpl`、artifact `templateString` 和 `.json` 都必须通过 `Renderer` 渲染，不能在调用方按运行时自行分支
- `Artifact` 通过 `{ renderer }` 注入渲染器，并使用 `render(context?)`；不要重新引入 `getEngine`、`templateEngine` 或 `render(engine, context)`
- Node 与 Worker 渲染器应使用同输入、同输出的 contract 测试验证兼容性，测试不应访问渲染器内部 engine

#### Worker 运行时

- Worker 项目使用 ESM 配置和构建期 manifest，Provider 必须显式注册，运行时不扫描目录
- `.tpl` 和 `templateString` 在构建期由 Nunjucks 预编译；manifest 只包含静态函数，运行时不得使用 `eval` 或 `new Function`
- `src/worker/precompiled-environment.ts` 是刻意收窄的预编译运行时。只有生成后的模板代码确实需要某项能力时才能扩展，并且必须增加 contract 测试
- Worker 依赖图不得包含完整 Nunjucks compiler、Node renderer、`fs-extra`、动态模块加载器或其他 Node-only 实现
- Worker runtime 的缓存、HTTP、DNS 和日志均通过 runtime context 注入；不要回退到 Node 单例或在 Worker 模块中直接加载 Node adapter
- Node 与 Worker 共用 `src/runtime/http-client.ts` 中基于 `ky` 的 HTTP 实现，通过注入 `fetch` 适配环境；不要增加 Got 或 Worker 专用 HTTP 分支
- DNS resolver 允许通过 runtime context 替换；默认实现只合并单进程并发查询，不增加持久缓存
- Worker 入口需要启用 Cloudflare `nodejs_compat`，但核心执行路径不能依赖运行时文件系统或动态代码执行

#### 缓存系统

- 缓存抽象位于 `src/cache/`：`TtlCache` 负责序列化和逻辑 TTL，`KvStore` 只负责字符串 KV 的 `get`、`put`、`delete`、`list` 和 `close`
- 支持 filesystem、Upstash REST 和 Cloudflare KV；项目不再支持 Redis/ioredis
- Node 默认缓存可以使用 filesystem；Worker 必须显式注入 `TtlCache` 和 `createCloudflareKvStore(env.SURGIO_CACHE)`
- Worker Provider、remote snippet 和 artifact 缓存必须共用 runtime 注入的缓存实例，不能访问 Node 的全局缓存对象
- Worker 代码只应导入 `surgio/cache/core` 和 `surgio/cache/cloudflare` 等明确子路径，避免把 filesystem 或 Upstash 客户端带入 Worker bundle

#### 过滤器系统

- 位于 `src/filters/` 目录，提供丰富的节点过滤功能
- 支持按国家、协议类型、关键词等条件过滤节点
- 可组合和链式调用多个过滤器

#### 验证器系统

- 基于 zod 实现的类型安全验证
- 覆盖配置文件、Provider 配置、节点数据等各个层面
- 提供详细的错误信息和类型提示

### CLI 架构

- 基于 oclif 框架构建
- 主命令包括：generate、doctor、lint、check 等
- 支持插件系统和自定义钩子
