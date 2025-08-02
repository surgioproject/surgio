# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# 运行单元测试 (使用 ava)
pnpm test:unit

# 运行单个测试文件
npx ava src/path/to/test.test.ts

# 运行 CLI 测试 (使用 mocha)
pnpm test:cli

# 更新 CLI 测试快照
pnpm test:cli:update

# 运行测试覆盖率
pnpm coverage
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
│   ├── generator/         # 配置文件生成器
│   ├── utils/             # 工具函数集合
│   ├── filters/           # 节点过滤器
│   ├── validators/        # 数据验证器 (基于 zod)
│   └── constant/          # 常量定义
├── docs/                  # 文档站点源码 (vuepress)
├── examples/              # 使用示例
└── test/                  # 测试文件
```

### 关键架构概念

#### Provider 系统

- Provider 是数据来源的抽象，负责从各种格式的订阅源获取节点数据
- 支持多种协议：Shadowsocks、ShadowsocksR、V2Ray、Trojan、Clash 等
- 主要 Provider 类型：
  - `ClashProvider`: 解析 Clash 格式订阅
  - `ShadowsocksSubscribeProvider`: 解析标准 SS 订阅
  - `V2rayNSubscribeProvider`: 解析 V2rayN 格式订阅
  - `CustomProvider`: 自定义节点定义

#### Generator/Artifact 系统

- `Artifact` 表示一个输出配置文件，结合 Provider 数据和模板生成最终配置
- `Template` 使用 Nunjucks 模板引擎，支持自定义模板函数和过滤器
- JSON Template 支持对 JSON 格式配置文件的扩展和合并

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
