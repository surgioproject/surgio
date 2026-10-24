# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-beta.3](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/%40surgio%2Fgateway%403.0.0-beta.2...%40surgio%2Fgateway%403.0.0-beta.3) (2026-09-30)

**Note:** Version bump only for package @surgio/gateway

# [3.0.0-beta.2](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/%40surgio%2Fgateway%403.0.0-beta.1...%40surgio%2Fgateway%403.0.0-beta.2) (2026-09-30)

### Features

- **gateway:** format subscription user info ([3afcf4f](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/3afcf4fc34761a65727d37dc3eee2571a37e658d))

# [3.0.0-beta.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/%40surgio%2Fgateway%403.0.0-beta.0...%40surgio%2Fgateway%403.0.0-beta.1) (2026-09-12)

### Features

- **gateway:** restrict headers and stabilize fallback cache key ([b7f7453](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/b7f7453c95a2f17b8d55ef0bd21f6dc8a31976bf))

# [3.0.0-beta.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/%40surgio%2Fgateway%402.4.1...%40surgio%2Fgateway%403.0.0-beta.0) (2026-09-06)

### Code Refactoring

- **gateway:** migrate from nestjs to hono ([74a091b](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/74a091b146696dca08969857e5531092fe7a963a))
- **gateway:** read worker secrets via process.env ([379fd4d](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/379fd4db20674a11a8bbdd31ef9542ede45eaf15))

### Features

- **gateway:** support project dir override in dev server ([eadc8a9](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/eadc8a97b9641d8d8f48b8813f35ed125e9eeff3))
- **gateway:** upgrade nestjs to v11 ([a3a0c11](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/a3a0c11041290731624723db96bca479c7e19ca0))
- **gateway:** use shared @surgio/logger ([0a713d8](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/0a713d8a118e6c4569c4626b1ba7e14478eb2561))

### BREAKING CHANGES

- **gateway:** Main entrypoint no longer exports createHttpServer,
  createLambdaHandler, startServer or bootstrapServer. Use the matching
  subpath entrypoints instead.
- **gateway:** WorkerGatewayBindings no longer accepts
  resolveSecret. Secrets are read directly from process.env.

## [2.4.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.4.0...@surgio/gateway@2.4.1) (2026-08-09)

**Note:** Version bump only for package @surgio/gateway

# [2.4.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.3.1...@surgio/gateway@2.4.0) (2026-08-09)

### Features

- add Loon provider template ([29dc313](https://github.com/surgioproject/packages/commit/29dc313868df632f7b28c086c90cd9878775ae15))

## [2.3.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.3.0...@surgio/gateway@2.3.1) (2026-01-20)

**Note:** Version bump only for package @surgio/gateway

# [2.3.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.2.3...@surgio/gateway@2.3.0) (2026-01-20)

### Bug Fixes

- correct type definition for processUrlParams result ([62b7874](https://github.com/surgioproject/packages/commit/62b7874656d9a9656be669f05f98d746a50ffc5b))

### chore

- **eslint:** migrate to flat config format ([ad558a4](https://github.com/surgioproject/packages/commit/ad558a48a38fbf3f956070595b9fd6c61bcf6308))

### Features

- **gateway:** add request headers passing functionality ([dcfba21](https://github.com/surgioproject/packages/commit/dcfba213bcadd70764f88a74fcc5fb38815fc550))
- **gateway:** pass request headers and user-agent to providers ([8ba7af3](https://github.com/surgioproject/packages/commit/8ba7af33d6b32dd7b7b8d82f772e8333268670a6))
- **gateway:** pass request headers to providers ([ddd6ec8](https://github.com/surgioproject/packages/commit/ddd6ec8c382ea3235b5ea0afbfec1c2317bea7b2))

### BREAKING CHANGES

- **eslint:** ESLint configuration format has changed from legacy to flat config.

## [2.2.3](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.2.2...@surgio/gateway@2.2.3) (2026-01-01)

**Note:** Version bump only for package @surgio/gateway

## [2.2.2](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.2.1...@surgio/gateway@2.2.2) (2026-01-01)

### Bug Fixes

- add type keyword to express imports ([2219ecd](https://github.com/surgioproject/packages/commit/2219ecdf23dbc8c81667570daafc8b60b1107c5e))

## [2.2.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.2.0...@surgio/gateway@2.2.1) (2026-01-01)

**Note:** Version bump only for package @surgio/gateway

# [2.2.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.1.1...@surgio/gateway@2.2.0) (2024-03-29)

**Note:** Version bump only for package @surgio/gateway

## [2.1.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.1.0...@surgio/gateway@2.1.1) (2024-03-16)

### Bug Fixes

- Extend getEngine in surgio-helper to accept clashCore configuration ([29deb88](https://github.com/surgioproject/packages/commit/29deb8824bbe98e611fbf68ad676a2baccda1f6a))

# [2.1.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.1...@surgio/gateway@2.1.0) (2024-02-03)

### Features

- support subscriptionUserInfoProvider ([a208091](https://github.com/surgioproject/packages/commit/a208091a91ed6a2fd402085ded9734dbda28a1d8))

## [2.0.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0...@surgio/gateway@2.0.1) (2023-07-08)

**Note:** Version bump only for package @surgio/gateway

# [2.0.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-beta.0...@surgio/gateway@2.0.0) (2023-06-24)

**Note:** Version bump only for package @surgio/gateway

# [2.0.0-beta.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-alpha.5...@surgio/gateway@2.0.0-beta.0) (2023-06-21)

### Features

- improve login ([bd14d7c](https://github.com/surgioproject/packages/commit/bd14d7c59e9b311c8c81f9381e7a49e76b0c6bc6))
- use unifiedCache to store rendered artifacts ([ea1ad3c](https://github.com/surgioproject/packages/commit/ea1ad3c8c4e117064f400e3d0301f72bcb16a7c7))

# [2.0.0-alpha.5](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-alpha.4...@surgio/gateway@2.0.0-alpha.5) (2023-06-15)

**Note:** Version bump only for package @surgio/gateway

# [2.0.0-alpha.4](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-alpha.3...@surgio/gateway@2.0.0-alpha.4) (2023-06-15)

### Bug Fixes

- bugfix ([f68920e](https://github.com/surgioproject/packages/commit/f68920edbcd365672d4f1d976af922ba98761fa5))

# [2.0.0-alpha.3](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-alpha.2...@surgio/gateway@2.0.0-alpha.3) (2023-06-02)

### Bug Fixes

- always invalidate incorrect cookie ([3788a49](https://github.com/surgioproject/packages/commit/3788a4980451e28d7b13a82fffa920860e63ae15))

# [2.0.0-alpha.2](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-alpha.1...@surgio/gateway@2.0.0-alpha.2) (2023-06-01)

### Bug Fixes

- test issue ([2013567](https://github.com/surgioproject/packages/commit/201356753c55f273ca9acd639014cecbc06d7f43))
- token isn't put on the url ([a38ed3f](https://github.com/surgioproject/packages/commit/a38ed3fdf45792b592fe650020ab4d417f011107))

# [2.0.0-alpha.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@2.0.0-alpha.0...@surgio/gateway@2.0.0-alpha.1) (2023-06-01)

**Note:** Version bump only for package @surgio/gateway

# [2.0.0-alpha.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.8.1...@surgio/gateway@2.0.0-alpha.0) (2023-06-01)

### Features

- adapt gateway to the new surgio structure ([6796194](https://github.com/surgioproject/packages/commit/679619498dcfdd2330588c794bb1e08ef01e88b1))
- adapt to the new surgio api ([9fc182b](https://github.com/surgioproject/packages/commit/9fc182b4bf80764ef0df2e1d98c9c903801ae939))
- address compatibility issues ([3de80d5](https://github.com/surgioproject/packages/commit/3de80d5e802cfcb88f580c19ca4083d50e7694c9))
- new ui ([7cbe8b2](https://github.com/surgioproject/packages/commit/7cbe8b2002f340f90d7595e9632249df4aba55ca))

## [1.8.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.8.0...@surgio/gateway@1.8.1) (2022-12-31)

**Note:** Version bump only for package @surgio/gateway

# [1.8.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.7.0...@surgio/gateway@1.8.0) (2022-10-04)

**Note:** Version bump only for package @surgio/gateway

# [1.7.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.7.0-alpha.0...@surgio/gateway@1.7.0) (2022-06-30)

**Note:** Version bump only for package @surgio/gateway

# [1.7.0-alpha.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.6.5...@surgio/gateway@1.7.0-alpha.0) (2022-06-29)

### Features

- change the way to verify authentication ([1e3ed34](https://github.com/surgioproject/packages/commit/1e3ed348ea04ea53a6ce1a3f36e77cf1975748b1))
- support viewerToken ([f880ea2](https://github.com/surgioproject/packages/commit/f880ea2ab573d83cfc27986191295be1a32d60bb))
- use viewerToken in frontend ([206a368](https://github.com/surgioproject/packages/commit/206a368123da41675f7b844859bdb71a861e40b8))

## [1.6.5](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.6.4...@surgio/gateway@1.6.5) (2022-06-01)

### Bug Fixes

- clash-provider template ([80ae5ca](https://github.com/surgioproject/packages/commit/80ae5ca2ca748cae3eb7de0e06ded10bd27eb6f7)), closes [surgioproject/surgio#193](https://github.com/surgioproject/surgio/issues/193)

## [1.6.4](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.6.3...@surgio/gateway@1.6.4) (2022-05-31)

### Bug Fixes

- wrong format ([f8e083f](https://github.com/surgioproject/packages/commit/f8e083fb697319923e37e5cd048287d5c12cf964))

## [1.6.3](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.6.2...@surgio/gateway@1.6.3) (2022-05-28)

### Features

- bypass prelease version checking ([0bc2912](https://github.com/surgioproject/packages/commit/0bc2912fbd72d7de27aa2aa46b2daa7132deb1d7))

## [1.6.2](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.6.1...@surgio/gateway@1.6.2) (2022-04-13)

### Bug Fixes

- make sure gateway depends on frontend package ([3059a44](https://github.com/surgioproject/packages/commit/3059a44627a690ac42a0167a79571d7a8da66fef))

## [1.6.1](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.6.0...@surgio/gateway@1.6.1) (2022-04-13)

### Bug Fixes

- no longer requires the new version of core ([ceece95](https://github.com/surgioproject/packages/commit/ceece955ad5f6a03dcba7c1479f8df2f94560067))

# [1.6.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.5.0...@surgio/gateway@1.6.0) (2022-04-10)

### Features

- 支持在请求订阅时使用请求端 user-agent ([c703be9](https://github.com/surgioproject/packages/commit/c703be990790cd2eee4416d8bedd21295f00b72f))

# [1.5.0](https://github.com/surgioproject/packages/compare/@surgio/gateway@1.4.1...@surgio/gateway@1.5.0) (2022-04-03)

### Features

- new export createLambdaHandler ([dfa5bb2](https://github.com/surgioproject/packages/commit/dfa5bb2b237696dbb1d91f93adf8264533b8b281))

## [1.4.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.4.0...@surgio/gateway@1.4.1) (2021-08-27)

### Bug Fixes

- compatibility issue with 2.10.0 ([b9c221f](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/b9c221f851badb449bc8d1ee600b6f67423a324d))

# [1.4.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.3.3...@surgio/gateway@1.4.0) (2021-08-12)

### Features

- remove cors package and route ([9e275ad](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/9e275add6ee4548605a2571edb265d27e8f74040))

## [1.3.3](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.3.2...@surgio/gateway@1.3.3) (2021-07-22)

**Note:** Version bump only for package @surgio/gateway

## [1.3.2](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.3.0...@surgio/gateway@1.3.2) (2021-07-22)

### Bug Fixes

- bugfix ([72dc35b](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/72dc35b76ef77add4991ab1c19fc67a440eab9f0))

## [1.3.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.3.0...@surgio/gateway@1.3.1) (2021-07-22)

### Bug Fixes

- bugfix ([72dc35b](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/72dc35b76ef77add4991ab1c19fc67a440eab9f0))

# [1.3.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.2.1...@surgio/gateway@1.3.0) (2021-02-17)

### Features

- add clean cache button ([52e68eb](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/52e68eb970c6e1d87317159cf37a0c80d02a7640))

## [1.2.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.2.0...@surgio/gateway@1.2.1) (2020-11-10)

### Bug Fixes

- response cache expires too soon ([d681615](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/d681615b5f8a40693f63b1caf4fab05dfb50e2c1))

# [1.2.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.1.1...@surgio/gateway@1.2.0) (2020-11-10)

### Features

- add artifact response cache ([e0b4517](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/e0b45179341222a795194226eb591b99967d955c))

## [1.1.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.1.0...@surgio/gateway@1.1.1) (2020-10-16)

### Bug Fixes

- service worker exclusion ([18ab90e](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/18ab90ebd0a4c90a52c5fc28670a3c8e5e9fdb05))

# [1.1.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.6...@surgio/gateway@1.1.0) (2020-10-15)

### Features

- support export ss, ssr, v2ray subcriptions ([5d0aed7](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/5d0aed71811fa1bf6a8023072da1866bba098ea0))

## [1.0.6](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.5...@surgio/gateway@1.0.6) (2020-09-28)

**Note:** Version bump only for package @surgio/gateway

## [1.0.5](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.4...@surgio/gateway@1.0.5) (2020-08-16)

### Bug Fixes

- 修复一些样式问题 ([160d5f6](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/160d5f6cf9859cfcf4f7a92dc7e4fc399d20db4b))

## [1.0.4](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.3...@surgio/gateway@1.0.4) (2020-07-13)

### Bug Fixes

- old cookies could not be replaced ([2e10b68](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/2e10b6881b35d95043e7f82f8508e882c69d3c08))

## [1.0.3](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.2...@surgio/gateway@1.0.3) (2020-07-12)

### Bug Fixes

- build ([3a7deca](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/3a7decaaeddee74b1deadca2c311812c279a8dfc))

## [1.0.2](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.1...@surgio/gateway@1.0.2) (2020-07-12)

### Bug Fixes

- surgio 版本判断错误 ([b41fda3](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/b41fda3d67a04a73cbf127d2f31e3219f6a92ae8))

## [1.0.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@1.0.0...@surgio/gateway@1.0.1) (2020-07-12)

### Bug Fixes

- cookie authentication ([a583d95](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/a583d9563795d1cf49d572c886d803ce4ad94dd8))
- cookie max-age ([167840a](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/167840a17ede4f3bf033587ed2feeebb0b5dce37))
- guards should be injectable ([3e3b76b](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/3e3b76b22585d6b211bb8155a184cdb2a76352dc))

# [1.0.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.6...@surgio/gateway@1.0.0) (2020-07-08)

### Features

- Embed 模式可以将 URL 中的参数添加到 Artifact 的下载 URL 中 ([2b2ca45](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/2b2ca45ffd065ac5c69f63b3ef6d90ebe3cf81fe))

## [0.13.6](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.5...@surgio/gateway@0.13.6) (2020-06-19)

**Note:** Version bump only for package @surgio/gateway

## [0.13.5](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.4...@surgio/gateway@0.13.5) (2020-06-19)

**Note:** Version bump only for package @surgio/gateway

## [0.13.4](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.3...@surgio/gateway@0.13.4) (2020-06-15)

### Bug Fixes

- wrong url replacement ([9d32521](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/9d32521d639d6e55d8a39f0be6521ed0d141c3ba))

## [0.13.3](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.2...@surgio/gateway@0.13.3) (2020-06-15)

### Bug Fixes

- cors-anywhere issue ([1ae7f6d](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/1ae7f6d38e38834f8d9d54039afffb1c89e4c102))

## [0.13.2](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.1...@surgio/gateway@0.13.2) (2020-06-15)

**Note:** Version bump only for package @surgio/gateway

## [0.13.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.13.0...@surgio/gateway@0.13.1) (2020-06-15)

### Bug Fixes

- missing dep ([75f924c](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/75f924c8a2a6712fbe3128fa3ae464a61837a341))
- test ([47b004c](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/47b004c0a51b158531c10d18cad160c441aa8c88))

# [0.13.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.12.2...@surgio/gateway@0.13.0) (2020-06-15)

### Features

- **controller:** proxy controller ([1fca26f](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/1fca26fc3435e31ba86b067fc4ebfbd881c1ac58))

## [0.12.2](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.12.1...@surgio/gateway@0.12.2) (2020-04-28)

**Note:** Version bump only for package @surgio/gateway

## [0.12.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.12.0...@surgio/gateway@0.12.1) (2020-04-23)

### Bug Fixes

- 服务端 cache-control 响应头不正确 ([bcc02fb](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/bcc02fb6d808440ef52103ec8fee43572318f56e))

# [0.12.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.12.0-alpha.1...@surgio/gateway@0.12.0) (2020-04-18)

**Note:** Version bump only for package @surgio/gateway

# [0.12.0-alpha.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.12.0-alpha.0...@surgio/gateway@0.12.0-alpha.1) (2020-04-17)

### Bug Fixes

- get-artifact 的托管地址变量随请求 URI 改变 ([e0fdabb](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/e0fdabb2beeec57008a49e721ab9cdbe375ddee4))

### Features

- 优化了远程片段加载的时机 ([c3b23f6](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/c3b23f67efd7ec60daeddb75197ec88e1a8c1f85))

### Reverts

- 关闭新启动方式开关 ([769d01c](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/769d01cb2738c14322951cd31b2e629e2bda5cf5))

# [0.12.0-alpha.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.11.0...@surgio/gateway@0.12.0-alpha.0) (2020-04-16)

### Bug Fixes

- test ([bbbcb8f](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/bbbcb8f7143ce82c861aecfb94c76efa7840237b))

### Features

- 尝试使用新的启动方式 ([3760043](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/37600436e1b1df21c36866bd84df47c526abc56f))

# [0.11.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.10.0...@surgio/gateway@0.11.0) (2020-04-13)

### Bug Fixes

- 开启 /render 路由鉴权 ([6d666f5](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/6d666f5f383a0874e085020554f34e96c764bdd5))
- 托管地址未能与 URL 中的参数保持一致 ([a91f722](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/a91f72297c50a06815868057be6031e0843c81e2))
- test ([4c8af0f](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/4c8af0fb531fa960cd3cc544c6d7368ab41dfc32))

### Features

- 新增路由 /render ([2d11f16](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/2d11f1609011ac8e3cad2be10c9204fef401270c))
- 允许用户指定使用指定 template 导出 providers ([e8ae5cf](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/e8ae5cffaa00d2df7f936afaad9518bdd047f4cc))

# [0.10.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.9.0...@surgio/gateway@0.10.0) (2020-04-08)

### Bug Fixes

- lint error ([f7158a8](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/f7158a8849926f1c42a8b6ac9e269226def35baf))
- some surgio api has chagned ([2701c22](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/2701c22205548c3fcadefd3c311cbfc59d7577d0))

### Features

- 网关 URL 中自定义参数可以定义成员变量 ([cf05f8d](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/cf05f8d6200852f167428ff25c2b2e8079f4f8c1))
- URL 参数 filter 应用自定义过滤器需要写完整 ([8156c47](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/8156c47914459cda48e58a06351faf4333c33886))

### BREAKING CHANGES

- 原本自定义过滤器的引用需要在名称前加入 `customFilters.`，例如：

```
?filter=customFilters.myFilter
```

# [0.9.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.8.1...@surgio/gateway@0.9.0) (2020-04-05)

### Bug Fixes

- error handling ([69112fc](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/69112fcadf48b220a08ba4a0c1983d7429e94e20))

### Features

- add /export-provider ([af41c1a](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/af41c1ae90732fa3130fd990e0b62257c7165cfc))
- API 支持直接输出 provider ([7f09fd3](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/7f09fd3f100b5e9715c4f5c9a77164891a1effd3))

## [0.8.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.8.0...@surgio/gateway@0.8.1) (2020-03-25)

### Bug Fixes

- should allow turning off authentication ([db80c03](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/db80c03479b698215f1b95c7f8f5cf377489f4cb))

# [0.8.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.7.0...@surgio/gateway@0.8.0) (2020-03-15)

### Features

- 读取 URL 参数，加入到 customParams 中 ([8b392f9](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/8b392f98dd6cf5a9017b085a5391173ac188b0d3))
- 改造错误页面 ([a495549](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/a495549c081c594a4825068693d9f2e158827697))
- 优化错误页面提示 ([83e2adc](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/83e2adc5f9703bc984fbf0cffaafa449dce795e6))

# [0.7.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.6.4...@surgio/gateway@0.7.0) (2020-03-10)

### Features

- Artifact embed 页面 ([c030895](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/c030895a26e3d0f78e6f89959bbf85f8e6ae6136))

## [0.6.4](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.6.3...@surgio/gateway@0.6.4) (2020-02-29)

### Bug Fixes

- /api/providers 接口数据结构问题 ([a8f2699](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/a8f2699376a0262c4369be9b78b3d8d5b9125ca8))

## [0.6.3](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.6.2...@surgio/gateway@0.6.3) (2020-02-29)

**Note:** Version bump only for package @surgio/gateway

## [0.6.2](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.6.1...@surgio/gateway@0.6.2) (2020-02-29)

### Bug Fixes

- upgrade error message ([72ce610](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/72ce6106c57d784d850d90749b92840ba271cd13))

## [0.6.1](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.6.0...@surgio/gateway@0.6.1) (2020-02-29)

### Bug Fixes

- 错误无法被正确处理 ([28904e9](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/28904e9f9bcb412c0d99050a4fc032ea4850c7a8))

# [0.6.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.5.0...@surgio/gateway@0.6.0) (2020-02-28)

### Features

- @surgio/logger ([16a41a9](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/16a41a9f671482b92238db70d755c4686c3e5ab9))
- /get-artifact 接口增加流量信息返回 ([188a550](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/188a550c5ca49f765b54c3c32eba03ee1496428b))
- 面板支持流量查询 ([f8dccc0](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/f8dccc038147381063b0bf03ba4b0619096a8d94))
- surgio 依赖版本检查 ([451dbff](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/451dbff591774352d330c6e851da93d951ccc388))

# [0.5.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.4.0...@surgio/gateway@0.5.0) (2020-02-23)

### Features

- 提供新的 serverless 启动方式 ([7283469](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/7283469b1741f49db6dab30f3bf643f2d066b741))

# [0.4.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.3.0...@surgio/gateway@0.4.0) (2020-02-23)

### Features

- cookie 有效期改为 1 个月并且可配置 ([28eeeb8](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/28eeeb81d1299ca2a431d0240ad4bc2fb971ce23))

# [0.3.0](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.2.5...@surgio/gateway@0.3.0) (2020-02-12)

### Features

- 完善日志输出 ([aa79045](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/aa790450e0c60de94f5b46fd702c24f91258cd62))

## [0.2.5](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.2.4...@surgio/gateway@0.2.5) (2020-02-11)

### Bug Fixes

- frontend 模块读取错误 ([cbddacd](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/cbddacd1cd5d73bacbc62899473c60c038beddfe))

## [0.2.4](https://github.com/surgioproject/packages/tree/master/packages/gateway/compare/@surgio/gateway@0.2.3...@surgio/gateway@0.2.4) (2020-02-11)

### Bug Fixes

- frontend folder lookup ([67f0c56](https://github.com/surgioproject/packages/tree/master/packages/gateway/commit/67f0c56d9f4115744a917dfef00c62ba6fa096ba))

## [0.2.3](https://github.com/surgioproject/packages/tree/master/packages/server/compare/@surgio/gateway@0.2.2...@surgio/gateway@0.2.3) (2020-02-11)

**Note:** Version bump only for package @surgio/gateway

## 0.2.2 (2020-02-11)

**Note:** Version bump only for package @surgio/gateway

# 0.1.0 (2020-02-10)
