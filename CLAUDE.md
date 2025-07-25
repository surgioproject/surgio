# Surgio 项目架构文档

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

# 运行单元测试
pnpm test:unit

# 运行 CLI 测试
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
│   ├── commands/          # CLI 命令实现
│   ├── provider/          # 数据提供者 (支持各种订阅格式)
│   ├── generator/         # 配置文件生成器
│   ├── utils/             # 工具函数集合
│   ├── filters/           # 节点过滤器
│   ├── validators/        # 数据验证器
│   └── constant/          # 常量定义
├── docs/                  # 文档站点源码
├── examples/              # 使用示例
└── test/                  # 测试文件
```
