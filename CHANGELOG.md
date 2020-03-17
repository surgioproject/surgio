# [1.16.0](https://github.com/geekdada/surgio/compare/v1.15.0...v1.16.0) (2020-03-17)


### Features

* 新增 new 命令 ([c4e27c5](https://github.com/geekdada/surgio/commit/c4e27c5e10941e37941e9da46e5ad0b0466d9a4d))



# [1.15.0](https://github.com/geekdada/surgio/compare/v1.14.0...v1.15.0) (2020-03-15)


### Bug Fixes

* 改善了错误信息提示 ([04a1536](https://github.com/geekdada/surgio/commit/04a15362cb0ca6935a2bb4d50500dbd5a7e1dc7a))
* 时间转换错误 ([3835f3f](https://github.com/geekdada/surgio/commit/3835f3f1c64357021e05538bd36b039b7ab0c65f))


### Features

* render 支持额外参数拓展 ([3638eb9](https://github.com/geekdada/surgio/commit/3638eb9a92f7b564e7e5789e658686987d5efe6c))



# [1.14.0](https://github.com/geekdada/surgio/compare/v1.13.5...v1.14.0) (2020-03-12)


### Features

* 支持加入自定义 trojan 节点 ([40b6714](https://github.com/geekdada/surgio/commit/40b67143fbf1f5e59cf5c4b08ef4eb62238f4678))
* 支持检查模板方法中无效的 filter ([9c2690b](https://github.com/geekdada/surgio/commit/9c2690b31d9266833e45c892fdad4daca6ce947e))
* 支持为 mellow 输出 ss uri ([c26cdb5](https://github.com/geekdada/surgio/commit/c26cdb552a882cc7e29448cd0a1129c25a9bccc7))



## [1.13.5](https://github.com/geekdada/surgio/compare/v1.13.4...v1.13.5) (2020-03-11)


### Bug Fixes

* surge ws-headers 值应用引号包裹 ([6be6ef4](https://github.com/geekdada/surgio/commit/6be6ef4eb094977a0cb2f9ef77c348aa8057399a))



## [1.13.4](https://github.com/geekdada/surgio/compare/v1.13.3...v1.13.4) (2020-03-08)


### Bug Fixes

* 流量 header 解析容错不足 ([f00c539](https://github.com/geekdada/surgio/commit/f00c53994bd07342d873f6eef4ff83c32848bf8b))


### Features

* 优化 check 命令体验 ([b6e6094](https://github.com/geekdada/surgio/commit/b6e60942795c89b375f9919a42467a5d33f99024))



## [1.13.3](https://github.com/geekdada/surgio/compare/v1.13.2...v1.13.3) (2020-03-05)


### Bug Fixes

* quantumultx 模板处理器不再使用 /qx-script API 地址 ([e39366c](https://github.com/geekdada/surgio/commit/e39366c772e558943c884059893fb0fa4468c14c))



## [1.13.2](https://github.com/geekdada/surgio/compare/v1.13.1...v1.13.2) (2020-03-04)


### Features

* 支持从 Clash 订阅中读取 vmess 自定义 header ([2ce351a](https://github.com/geekdada/surgio/commit/2ce351a0ac8a659925bdf8cf995c9347127699dd))



## [1.13.1](https://github.com/geekdada/surgio/compare/v1.13.0...v1.13.1) (2020-02-28)


### Bug Fixes

* chinaBackFilter 无法使用 ([26f03a2](https://github.com/geekdada/surgio/commit/26f03a2b199e433abe79cabf72aca5b02eaaa29c))



# [1.13.0](https://github.com/geekdada/surgio/compare/v1.12.3...v1.13.0) (2020-02-28)


### Bug Fixes

* 避免有的 Provider 不支持获取流量的方法 ([3f6a6ee](https://github.com/geekdada/surgio/commit/3f6a6ee1b1f163838ad7d0df659274c99026372b))


### Features

* 为常用 Provider 类型增加订阅流量信息接口 ([ed68cab](https://github.com/geekdada/surgio/commit/ed68cab12a5417850229acbfa564a4436577e5cb))
* 修改 Artifact 初始化接口 ([4c3ac84](https://github.com/geekdada/surgio/commit/4c3ac847adae2bb492fa851e53b12213a6e379c7))
* 增加查询流量命令 ([a94eeab](https://github.com/geekdada/surgio/commit/a94eeab89b0a0c3432af2f9796d44e700084b93c))
* 支持从 SSR 订阅中读取剩余流量 ([fb2e886](https://github.com/geekdada/surgio/commit/fb2e886cac5428cdfac49bd6696a68e2494c2ea1))
* 支持在 Artifact 初始化时传入 Environment ([75ae51f](https://github.com/geekdada/surgio/commit/75ae51f3e9fafddade282d4348cbbcb9db774d36))
* Artifact 初始化后返回实例 ([7ca04cf](https://github.com/geekdada/surgio/commit/7ca04cfb07fa308abd90f475b1bd35ce58d183df))



## [1.12.3](https://github.com/geekdada/surgio/compare/v1.12.2...v1.12.3) (2020-02-24)


### Bug Fixes

* 某些情况下 v2ray 配置 port 为字符串 ([b8af4d7](https://github.com/geekdada/surgio/commit/b8af4d799d70d02c5b4361954f38625afd891973)), closes [#59](https://github.com/geekdada/surgio/issues/59)
* external provider 的 addresses 参数只应该写 IP ([f7006d6](https://github.com/geekdada/surgio/commit/f7006d676317db5eb0b6aac66440f9a76f7d8db4))


### Features

* 新增回国节点 Filter chinaBackFilter ([4f86829](https://github.com/geekdada/surgio/commit/4f868292c8660f227ff449c3767224bdf19fe7b9)), closes [#57](https://github.com/geekdada/surgio/issues/57)



## [1.12.2](https://github.com/geekdada/surgio/compare/v1.12.1...v1.12.2) (2020-02-19)


### Features

* allow new unknown keys to gateway ([ec0d3a9](https://github.com/geekdada/surgio/commit/ec0d3a9a0fc1e64352b09d36688bf9f89a7f8262))



## [1.12.1](https://github.com/geekdada/surgio/compare/v1.12.0...v1.12.1) (2020-02-15)


### Bug Fixes

* 修复某些情况下代理环境变量不生效的问题 ([7deb7d9](https://github.com/geekdada/surgio/commit/7deb7d9becf6d52310943286dbbb4c067be5f3eb))



# [1.12.0](https://github.com/geekdada/surgio/compare/v1.11.3...v1.12.0) (2020-02-11)


### Bug Fixes

* package.json & yarn.lock to reduce vulnerabilities ([aea1843](https://github.com/geekdada/surgio/commit/aea184321ec8629e5e8f27ae49bf4d0464acf699))


### Features

* Artifact 增加 categories 字段 ([967fc7c](https://github.com/geekdada/surgio/commit/967fc7c5dd3c87e8fe65fb54b74a03b136dc9531))
* Clash 规则处理优化 ([bec9abe](https://github.com/geekdada/surgio/commit/bec9abea9ec816f545a5dc0254979c817b288541))



## [1.11.3](https://github.com/geekdada/surgio/compare/v1.11.2...v1.11.3) (2020-01-23)


### Bug Fixes

* quanx 规则处理优化 ([036696a](https://github.com/geekdada/surgio/commit/036696a3bcdee4f74ef3aaa3648f25a0a9e9c53f))



## [1.11.2](https://github.com/geekdada/surgio/compare/v1.11.1...v1.11.2) (2020-01-05)


### Features

* support clash no-resolve ([cd349bc](https://github.com/geekdada/surgio/commit/cd349bc7be9e48850753f4f42f51b816c5a46fdf))
* support HTTP protocol ([dde1591](https://github.com/geekdada/surgio/commit/dde1591c885fac2a7c8829f146ffa6264dafbaa7))



## [1.11.1](https://github.com/geekdada/surgio/compare/v1.11.0...v1.11.1) (2020-01-02)


### Bug Fixes

* 代理环境变量失效 ([469b031](https://github.com/geekdada/surgio/commit/469b0318e79e52522296a1a69773fc5ff2b6fca3))



# [1.11.0](https://github.com/geekdada/surgio/compare/v1.10.1...v1.11.0) (2020-01-02)


### Features

* 支持 Clash 的 Provider 片段 ([5c42328](https://github.com/geekdada/surgio/commit/5c4232809e60514121c1579deaa8ce9dbd151323))
* 支持新的 Clash 规则配置方法 ([48b90e1](https://github.com/geekdada/surgio/commit/48b90e142dcd5c200ddd1b1e4cae8b6e97d918bb))
* useProviders, discardProviders ([e11cb75](https://github.com/geekdada/surgio/commit/e11cb75d3d58189e9dacc2c4f699e514ab1a33c1)), closes [#51](https://github.com/geekdada/surgio/issues/51)



## [1.10.1](https://github.com/geekdada/surgio/compare/v1.10.0...v1.10.1) (2019-12-29)


### Features

* remove speed test command ([47dfaa0](https://github.com/geekdada/surgio/commit/47dfaa0e2914bd7e1f9c96e90e4afe4a5f17d303))



# [1.10.0](https://github.com/geekdada/surgio/compare/v1.9.0...v1.10.0) (2019-12-29)


### Bug Fixes

* 在 external 中开启 tfo 和 mptcp 是没有意义的 ([8b0e6f0](https://github.com/geekdada/surgio/commit/8b0e6f07b35da4a6d0ab7164c1dd572e387b8b90))
* broken test ([25fcde6](https://github.com/geekdada/surgio/commit/25fcde69365ca66dfcce3fe260a1c6e2d0bd57b3))
* LRU 缓存可能会被污染 ([929f7bd](https://github.com/geekdada/surgio/commit/929f7bd3a32adc40eb23ec782eba1ce2978569d8))
* Provider 组合后生成结果排序错乱 ([d051b28](https://github.com/geekdada/surgio/commit/d051b2851ff401038587baa88f0e5ddc134471bc))


### Features

* 域名解析失败后跳过 ([66f5af8](https://github.com/geekdada/surgio/commit/66f5af8d31416591a29e28ac8ae03d978fa50862))
* 支持从 Clash 订阅中读取 skipCertVerify ([c856731](https://github.com/geekdada/surgio/commit/c856731cec14246b1ced594627daa5c50a2959cd))
* 支持配置 Provider 缓存 ([16dc8fc](https://github.com/geekdada/surgio/commit/16dc8fce9911fee2cae2e8c12e8649d3ede44dfa))
* v2ray-plugin 强制输出 mux: false ([ba635c5](https://github.com/geekdada/surgio/commit/ba635c599065a88d5ba9d0fcd94a1f4939140da1))



# [1.9.0](https://github.com/geekdada/surgio/compare/v1.8.5...v1.9.0) (2019-12-25)


### Bug Fixes

* test ([6cb39d8](https://github.com/geekdada/surgio/commit/6cb39d822ec02d9237a5420866bb544e09c76f26))


### Features

* add support for v2ray-plugin ([118a94a](https://github.com/geekdada/surgio/commit/118a94a531afb2353b61dcb698fd52b23d22df07))



## [1.8.5](https://github.com/geekdada/surgio/compare/v1.8.4...v1.8.5) (2019-12-11)


### Features

* 更新 netflixFilter ([515cbe5](https://github.com/geekdada/surgio/commit/515cbe5a179f6a7a364dc4e0eba72f264fb82b57))
* 更新国旗数据库 ([18f22d2](https://github.com/geekdada/surgio/commit/18f22d213e90fc9f680323439cbe4082ea2b171b))
* 支持修改节点名 ([4437f0e](https://github.com/geekdada/surgio/commit/4437f0e628d13ae5f675b04aa0b7e44b66bc37a7))



## [1.8.4](https://github.com/geekdada/surgio/compare/v1.8.3...v1.8.4) (2019-12-10)


### Bug Fixes

* Ruleset 中 IP-CIDR6 的处理不当 ([edee2bd](https://github.com/geekdada/surgio/commit/edee2bd3de6a3154f651629b780319533bd5445b))



## [1.8.3](https://github.com/geekdada/surgio/compare/v1.8.2...v1.8.3) (2019-12-04)


### Bug Fixes

* 在某些情况下 Clash 的策略组中没输出 url 和 interval ([3884014](https://github.com/geekdada/surgio/commit/3884014c2296a59de90ae5f5e4803a3609f7893d))
* broken test ([794be85](https://github.com/geekdada/surgio/commit/794be85268811ab665351ab255f368bc4a6d0754))



## [1.8.2](https://github.com/geekdada/surgio/compare/v1.8.1...v1.8.2) (2019-11-27)


### Bug Fixes

* clash conf empty line ([5af023d](https://github.com/geekdada/surgio/commit/5af023d8e96cda22e5df82bfebb18aaca19ccf33))



## [1.8.1](https://github.com/geekdada/surgio/compare/v1.8.0...v1.8.1) (2019-11-27)


### Bug Fixes

* remote-snippet cache throw error in non-now deployment ([a848988](https://github.com/geekdada/surgio/commit/a848988d2ed393ae1afa14bd5812eed989e9ffc5))



# [1.8.0](https://github.com/geekdada/surgio/compare/v1.7.1...v1.8.0) (2019-11-27)


### Bug Fixes

* **gateway:** content-type validation ([9b73c03](https://github.com/geekdada/surgio/commit/9b73c03fa3392e076cfed8d72833bf999a989b7b))


### Features

* **gateway:** 支持批量转换 rewrite-remote 中的 URL ([f589a83](https://github.com/geekdada/surgio/commit/f589a83c48ef66199fc6b00cb7bf5d96a4899a19))



## [1.7.1](https://github.com/geekdada/surgio/compare/v1.7.1-2...v1.7.1) (2019-11-26)


### Features

* **utils:** 重写了 Ruleset 的解析，支持所有 Ruleset 规则了 ([1717964](https://github.com/geekdada/surgio/commit/17179642250ea654931f837a186f10b4d88fc653))



## [1.7.1-2](https://github.com/geekdada/surgio/compare/v1.7.1-1...v1.7.1-2) (2019-11-26)


### Features

* always add domain to surge external provider's args ([98ebd89](https://github.com/geekdada/surgio/commit/98ebd8963f582c934f26f5beff93b362ccfdaa2d))



## [1.7.1-1](https://github.com/geekdada/surgio/compare/v1.7.1-0...v1.7.1-1) (2019-11-26)


### Features

* **gateway:** 延长缓存时间至 12 个小时并增加环境变量配置 ([c7bdc5e](https://github.com/geekdada/surgio/commit/c7bdc5e289f9ee0b8063a2fafac94b24008ec909))
* **utils:** 优化远程片段缓存读取 ([e8133f5](https://github.com/geekdada/surgio/commit/e8133f5abf0f52fa29d6d60db8675e95f60a5e11))



## [1.7.1-0](https://github.com/geekdada/surgio/compare/v1.7.0...v1.7.1-0) (2019-11-24)


### Features

* 在 Now 平台上开启文件缓存，加快启动速度 ([4456d2e](https://github.com/geekdada/surgio/commit/4456d2eb8b7bd5f387bab96d78e38b8f79c86cb3))
* 支持转换 Surge 的 Script 部分规则到 Quantumult X 格式 ([82633d2](https://github.com/geekdada/surgio/commit/82633d24221b14931d8c5ad367bb7c88ec7a7952))



# [1.7.0](https://github.com/geekdada/surgio/compare/v1.6.2...v1.7.0) (2019-11-23)


### Bug Fixes

* destDir 兼容 windows 地址 ([e9b60e8](https://github.com/geekdada/surgio/commit/e9b60e8e5d4799b79031f7aecd13e1b9081657c4))


### Features

* 支持给 qx 远程 script 添加 device id ([e9b9790](https://github.com/geekdada/surgio/commit/e9b97905e63ee1662310b4b4353308836093316d))



## [1.6.2](https://github.com/geekdada/surgio/compare/v1.6.1...v1.6.2) (2019-11-21)


### Bug Fixes

* 规则过滤会吃掉内容的问题 ([699b875](https://github.com/geekdada/surgio/commit/699b8750f9b8a4c8ef916f2ad9dfa9b8bf95333c))



## [1.6.1](https://github.com/geekdada/surgio/compare/v1.6.0...v1.6.1) (2019-11-20)


### Bug Fixes

* getDownloadUrl 某些情况下无法正确输出 access_token ([ce5cb2d](https://github.com/geekdada/surgio/commit/ce5cb2dd36d8f0d67b4bcf0c01efb77ea10cb4ca))
* urlBase 错误 ([d1e87dd](https://github.com/geekdada/surgio/commit/d1e87dd4770773bf8ea2763e39a31bb90ee68c62))



# [1.6.0](https://github.com/geekdada/surgio/compare/v1.5.0...v1.6.0) (2019-11-20)


### Bug Fixes

* broken ([53b65cc](https://github.com/geekdada/surgio/commit/53b65ccbd97a8d05c2fb5c173d51caadf2f35e78))


### Features

* 网关 get-artifact 支持直接输出 surge 和 qx 的节点列表 ([97f78c4](https://github.com/geekdada/surgio/commit/97f78c49ba3eeb050361807e2cbbfc44523f0804))
* 优化 dns 解析 ([345790e](https://github.com/geekdada/surgio/commit/345790eecd6b2f4745b91999004d921f41b259bc))
* 在模板中输出 proxyTestUrl ([b95cd8b](https://github.com/geekdada/surgio/commit/b95cd8b157e902a920699618cf1e61d1f615fd31))



# [1.5.0](https://github.com/geekdada/surgio/compare/v1.4.3...v1.5.0) (2019-11-18)


### Bug Fixes

* 空文件不会返回 404 ([271c398](https://github.com/geekdada/surgio/commit/271c398df29e8e3da2f4f22d6aa2d78aa49f122c))
* 某些情况下 clash 配置没有输出 interval 和 url ([1978429](https://github.com/geekdada/surgio/commit/197842956a96fd35b91afd77cf358c1697ac7097))


### Features

* 增加规则过滤关键词 ([128f648](https://github.com/geekdada/surgio/commit/128f64835ccde09b4b0dda54e4075dc0218fbc10))
* 支持排序类型的过滤器 ([db69447](https://github.com/geekdada/surgio/commit/db694473b1b88e44811971fbc0cd8761d0fcf4e3))
* 支持在输出 external 时解析域名 ([1f78f44](https://github.com/geekdada/surgio/commit/1f78f44dde2949e384184d8fa59f566a45ed2d64))
* nodeFilter 也支持过滤排序 ([6dd7f66](https://github.com/geekdada/surgio/commit/6dd7f665d26ad427f026786d5add8c578084f816))



## [1.4.3](https://github.com/geekdada/surgio/compare/v1.4.2...v1.4.3) (2019-11-15)


### Bug Fixes

* 某些情况下 Provider 中的 customFilters 未生效 ([48f1b32](https://github.com/geekdada/surgio/commit/48f1b321a2c4fbc6859b67a8975f1c9529bfaa20))



## [1.4.2](https://github.com/geekdada/surgio/compare/v1.4.1...v1.4.2) (2019-11-14)


### Features

* 优化远程片段获取的并发请求 ([7552fa0](https://github.com/geekdada/surgio/commit/7552fa05b073871aa6a50472f2386bfa4fa9421d))
* Provider 处理改为并发 ([8bf2738](https://github.com/geekdada/surgio/commit/8bf2738f14f9d30b9bfbf6999fbbdf91a5993469))



## [1.4.1](https://github.com/geekdada/surgio/compare/v1.4.0...v1.4.1) (2019-11-13)


### Bug Fixes

* clash 策略名错误 ([9f2eaac](https://github.com/geekdada/surgio/commit/9f2eaacb851a2b993412ae30be8946a9408df87a))



# [1.4.0](https://github.com/geekdada/surgio/compare/v1.3.5...v1.4.0) (2019-11-13)


### Bug Fixes

* 由于 mellow 对 shadowsocks 支持有限，忽略该类型节点 ([8ae0561](https://github.com/geekdada/surgio/commit/8ae056194b938014eee4c0bebfb38ecf3de7cb10))
* Close [#35](https://github.com/geekdada/surgio/issues/35) ([491b655](https://github.com/geekdada/surgio/commit/491b655bc8061ed120ab119bd5e4ac57859ea095))


### Features

* 可配置 Clash 的 proxy test url ([89b0b92](https://github.com/geekdada/surgio/commit/89b0b926a5ee5011f9b11cfe4d0a0c745c9ca890))
* 增加 mellow 规则处理方法 ([b646199](https://github.com/geekdada/surgio/commit/b646199507d7558bd00daa89f4877501391e2605))
* 支持 Clash 的 'fallback-auto', 'load-balance' 策略 ([18f106f](https://github.com/geekdada/surgio/commit/18f106fee8c94c01bbf8a4a34fadfcd9557fdd2b)), closes [#34](https://github.com/geekdada/surgio/issues/34)
* 支持单独定义某个 artifact 的输出目录 ([bef00c7](https://github.com/geekdada/surgio/commit/bef00c7d9894476c695229a6e96f1d3f47fd91b1))
* 支持导出 Mellow 节点 ([9a72ca2](https://github.com/geekdada/surgio/commit/9a72ca2ac7b9b59ee3c1b61180fd8fe915330ad8))
* 支持在 surgio.conf.js 中定义全局 customFilters ([1701b85](https://github.com/geekdada/surgio/commit/1701b85d68e487b52fb529243d8826ee4b5a99a8))



## [1.3.5](https://github.com/geekdada/surgio/compare/v1.3.4...v1.3.5) (2019-11-08)


### Bug Fixes

* QuantumultX 的兼容性问题 ([dfb5c2e](https://github.com/geekdada/surgio/commit/dfb5c2e7b04df85b24a1ca67bde9136ae8c68b97))



## [1.3.4](https://github.com/geekdada/surgio/compare/v1.3.3...v1.3.4) (2019-11-07)


### Bug Fixes

* vmess method 为 auto 时 qx 会无法识别 ([9adbe77](https://github.com/geekdada/surgio/commit/9adbe776dd1c9743be6878e6610dfb37a0ca4fc5))


### Features

* add snell support for clash output [#33](https://github.com/geekdada/surgio/issues/33) ([8c3df9e](https://github.com/geekdada/surgio/commit/8c3df9e97d9b22258f5aa99c8a89fdc6220b0f78))



## [1.3.3](https://github.com/geekdada/surgio/compare/v1.3.2...v1.3.3) (2019-11-06)


### Bug Fixes

* 没有在 QuantumultX vmess 节点中添加 obfs-host ([2d9ceb5](https://github.com/geekdada/surgio/commit/2d9ceb542eba4a3d7b770e3e46accb792201c28e))


### Features

* 面板增加添加 Clash 的按钮 ([b66e5f3](https://github.com/geekdada/surgio/commit/b66e5f31dae975ccac83742666ea7385a6e023e0))
* check command ([2db635f](https://github.com/geekdada/surgio/commit/2db635ff91cd786daa6852abdd82896ab213f3ab))



## [1.3.2](https://github.com/geekdada/surgio/compare/v1.3.1...v1.3.2) (2019-11-05)


### Features

* youtubePremiumFilter 增加香港 ([821bf3c](https://github.com/geekdada/surgio/commit/821bf3c653767490bf093e0980be091b28f3501d))
* youtubePremiumFilter 增加新加坡 ([7b32873](https://github.com/geekdada/surgio/commit/7b32873ff906156208ae7a03ea8002534a794c57))



## [1.3.1](https://github.com/geekdada/surgio/compare/v1.3.0...v1.3.1) (2019-11-03)


### Bug Fixes

* 没有在 getQuantumultXNodes 中正确输出支持 udp 的 ssr 节点 ([7815b42](https://github.com/geekdada/surgio/commit/7815b42252c6402c0905e2cc7b238635f37fa6e7))



# [1.3.0](https://github.com/geekdada/surgio/compare/v1.3.0-1...v1.3.0) (2019-11-03)


### Bug Fixes

* example ([ec6da29](https://github.com/geekdada/surgio/commit/ec6da29fd71ea54c768866d8c1b1fce4e8ec2087))



# [1.3.0-1](https://github.com/geekdada/surgio/compare/v1.3.0-0...v1.3.0-1) (2019-11-02)


### Bug Fixes

* surge tfo 参数缺失 ([47f4293](https://github.com/geekdada/surgio/commit/47f4293e4a59413b1b6574c58580230a6020defb))



# [1.3.0-0](https://github.com/geekdada/surgio/compare/v1.2.1...v1.3.0-0) (2019-11-02)


### Features

* 节点增加 tfo 参数 ([a820b89](https://github.com/geekdada/surgio/commit/a820b89590ac3379ccf109539000783b0d7b803a))
* 仅支持读取 ws 和 tcp 类型的 vmess 节点 ([de5bb35](https://github.com/geekdada/surgio/commit/de5bb35fcc3b4b4e6bb1bb12a6cc6f53bd6de2c8))
* 新增 getQuantumultXNodes ([d284d04](https://github.com/geekdada/surgio/commit/d284d0415e9524dffebd73d6085d1e11ceef3621))
* udp-relay 的值改为布尔类型，兼容字符串类型 ([f3eaaed](https://github.com/geekdada/surgio/commit/f3eaaed03727de525e12a454a8a966fd923f8d89))



## [1.2.1](https://github.com/geekdada/surgio/compare/v1.2.0...v1.2.1) (2019-11-01)


### Bug Fixes

* 遗漏了一种 clash 的 ss 混淆格式 ([4791328](https://github.com/geekdada/surgio/commit/4791328076b68b01d2b3c64da3738339238c2938))



# [1.2.0](https://github.com/geekdada/surgio/compare/v1.1.1...v1.2.0) (2019-11-01)


### Bug Fixes

* 加国旗正确识别中转节点了 ([3751dbf](https://github.com/geekdada/surgio/commit/3751dbf0f7f0d8619cfa28b2ec2cc8c24c4494a7))
* protoparam 和 obfsparam 中不能有空格 ([6cdb978](https://github.com/geekdada/surgio/commit/6cdb97880913a594115a59d49bfebcf90c555f7f))


### Features

* 不合法 yaml 文件识别 ([1654534](https://github.com/geekdada/surgio/commit/16545347613026a57bac46eb286e52f894384c11))
* 兼容v2rayn 订阅格式 ([8ba4625](https://github.com/geekdada/surgio/commit/8ba4625955bfb068028303a56148ac20e109e6e3))
* 允许用户覆盖 clash 订阅的 udp 转发支持 ([bb58c50](https://github.com/geekdada/surgio/commit/bb58c50aa5334ea9ce1ee4c323aa531dcbb32e79))
* 增加 netflixFilter 规则 ([5cc52f1](https://github.com/geekdada/surgio/commit/5cc52f1c237b9c4fcf2dee56ea3c0caaf82695ad))
* 支持读取 Clash 订阅 ([45ef59f](https://github.com/geekdada/surgio/commit/45ef59f359e21e37f5dac242a33888c74ec1afbc))
* proxyGroupModifier 支持 filter 和 proxies 组合 ([ba0f0c6](https://github.com/geekdada/surgio/commit/ba0f0c6bee8a14490c0124a7ff0773e636fd27e4))



## [1.1.1](https://github.com/geekdada/surgio/compare/v1.1.0...v1.1.1) (2019-10-29)


### Features

* 新增过滤器 discardKeywords ([b9f0ecb](https://github.com/geekdada/surgio/commit/b9f0ecb97366835a71862cd8f032048322266336))
* better error message ([26fcaa3](https://github.com/geekdada/surgio/commit/26fcaa3310046fbd886cff2370a8bf31be96dcca))
* gateway request log ([891168b](https://github.com/geekdada/surgio/commit/891168b6a702a0440b5d0475a25d11345d594f52))
* quick editing from list-artifact ([2d1d605](https://github.com/geekdada/surgio/commit/2d1d605fe5dd36332a8f04476d397cb7a14b6684))



# [1.1.0](https://github.com/geekdada/surgio/compare/v1.0.3...v1.1.0) (2019-10-28)


### Features

* add koa server for gateway ([bc4e9fc](https://github.com/geekdada/surgio/commit/bc4e9fce23b50a3fc970f8afaeb6bf087e077b4e))
* gateway authentication ([48d5371](https://github.com/geekdada/surgio/commit/48d53715a4373fc3fb75439c2902bffcdd7fa960))



## [1.0.3](https://github.com/geekdada/surgio/compare/v1.0.2...v1.0.3) (2019-10-28)


### Bug Fixes

* add new validation schema ([8cfcdb4](https://github.com/geekdada/surgio/commit/8cfcdb4eb055d58c585fe58361a9d26f96bf4bc2))


### Features

* 优化 list-artifact 样式 ([e03f807](https://github.com/geekdada/surgio/commit/e03f807502fb705b0e6d00fe8761f318bb8dc238))



## [1.0.2](https://github.com/geekdada/surgio/compare/v1.0.1...v1.0.2) (2019-10-27)


### Bug Fixes

* user config got contaminated during execution in now.sh ([5c64975](https://github.com/geekdada/surgio/commit/5c649753e86f5e9e155a667b93250d33c5cac3f5))



## [1.0.1](https://github.com/geekdada/surgio/compare/v1.0.0...v1.0.1) (2019-10-27)


### Bug Fixes

* better hot start for now.sh ([8781c56](https://github.com/geekdada/surgio/commit/8781c566603947d9ca7200fc6b20a231b854b574))


### Features

* list-artifact 支持展示 combineProviders ([1526c6b](https://github.com/geekdada/surgio/commit/1526c6ba986b165666edfe215922ba226defff9e))



# [1.0.0](https://github.com/geekdada/surgio/compare/v0.13.2...v1.0.0) (2019-10-27)


### Bug Fixes

* axios stub url ([67c9a99](https://github.com/geekdada/surgio/commit/67c9a992ef640db964f0f71a4da55dd9213cc719))
* import ([1be8ea4](https://github.com/geekdada/surgio/commit/1be8ea40591c8dc24bc535bae4c2ee514cb4cb14))
* schema ([ea7a8c0](https://github.com/geekdada/surgio/commit/ea7a8c070a75dde0700d05f14457fab0ec535324))
* validation ([ec60d1a](https://github.com/geekdada/surgio/commit/ec60d1a0315813b5841829c5a174dec931f2332e))


### Features

* 合并 Provider 接口定义 ([f197e19](https://github.com/geekdada/surgio/commit/f197e198aaf826b91af6896d02046c15976e4962))
* getNodeNames 和 getClashNodeNames 不再过滤 nodeType ([6571511](https://github.com/geekdada/surgio/commit/6571511f3d30aa3a283a69b81afb9aa548031b18))
* schema validation for config ([9f11254](https://github.com/geekdada/surgio/commit/9f11254d2bc7107e2299e1146553b03da1e9849f))
* schema validation for provider ([d738e0f](https://github.com/geekdada/surgio/commit/d738e0f999c91f577deb14793889210620757f36))



## [0.13.2](https://github.com/geekdada/surgio/compare/v0.13.1...v0.13.2) (2019-10-25)


### Bug Fixes

* package.json to reduce vulnerabilities ([76165a4](https://github.com/geekdada/surgio/commit/76165a45cfb993ac6f91400b40aeb078695d8430))


### Features

* add customParams for templates ([8658aa2](https://github.com/geekdada/surgio/commit/8658aa25277a927679822d8cb1fb66f54d71f6e6))
* add timeout env ([7835e2c](https://github.com/geekdada/surgio/commit/7835e2cc9f23bcbed9d1f8322adf3f8c76c250e7))
* getQuantumultNodes 增加 filter 支持 ([9b1d280](https://github.com/geekdada/surgio/commit/9b1d280c2cda52c791ed0896263c23505f233bda))



## [0.13.1](https://github.com/geekdada/surgio/compare/v0.13.0...v0.13.1) (2019-10-20)


### Features

* add direct download ([620b7dd](https://github.com/geekdada/surgio/commit/620b7dd0f799523bb9d55b6129b7db79bb25d35a))
* add noindex meta ([7fc102a](https://github.com/geekdada/surgio/commit/7fc102a37c53a3c046f664a5f7ff2a184b90b3bf))



# [0.13.0](https://github.com/geekdada/surgio/compare/v0.12.6...v0.13.0) (2019-10-19)


### Features

* gateway 支持查看所有 artifact ([7cd7dc3](https://github.com/geekdada/surgio/commit/7cd7dc3b8b1f3e576714388ea2adc223327d7885))



## [0.12.6](https://github.com/geekdada/surgio/compare/v0.12.5...v0.12.6) (2019-10-16)


### Features

* add more server log ([de77875](https://github.com/geekdada/surgio/commit/de77875fc2befcd2f081b3cb77c4496d1ea53f5f))



## [0.12.5](https://github.com/geekdada/surgio/compare/v0.12.4...v0.12.5) (2019-10-15)


### Bug Fixes

* 国旗被重复添加 ([80eff22](https://github.com/geekdada/surgio/commit/80eff22c9f631b3874c7aa63cbbb63c910476ea5))



## [0.12.4](https://github.com/geekdada/surgio/compare/v0.12.3...v0.12.4) (2019-10-15)


### Bug Fixes

* write permission ([5b34129](https://github.com/geekdada/surgio/commit/5b34129d3edae83996f3a58d3f75f84fcdf89c99))



## [0.12.3](https://github.com/geekdada/surgio/compare/v0.12.2...v0.12.3) (2019-10-15)


### Bug Fixes

* config dir write permission problem ([90b6d71](https://github.com/geekdada/surgio/commit/90b6d711bd22d5fa90e97e87f02cb3c32fc66a62))



## [0.12.2](https://github.com/geekdada/surgio/compare/v0.12.1...v0.12.2) (2019-10-15)



## [0.12.1](https://github.com/geekdada/surgio/compare/v0.12.0...v0.12.1) (2019-10-15)


### Features

* add cache to remote snippet ([265c42c](https://github.com/geekdada/surgio/commit/265c42cab77a965540f56a6e06e32f6a9741eb55))
* add support to now.sh ([9e23a25](https://github.com/geekdada/surgio/commit/9e23a25c9ba85f068cac5a441685b9630d1fec4c))



# [0.12.0](https://github.com/geekdada/surgio/compare/v0.11.6...v0.12.0) (2019-10-14)


### Features

* support aliyun serverless service ([0108097](https://github.com/geekdada/surgio/commit/0108097f3d20e200698d2eb2da2604f71d4ef1c8))



## [0.11.6](https://github.com/geekdada/surgio/compare/v0.11.5...v0.11.6) (2019-10-13)


### Bug Fixes

* 如果节点名中已经存在 emoji 则不处理 ([7fb1140](https://github.com/geekdada/surgio/commit/7fb1140b08e0e074d86992f69fa004cccd84869c))



## [0.11.5](https://github.com/geekdada/surgio/compare/v0.11.4...v0.11.5) (2019-10-10)


### Bug Fixes

* clash 规则中出现了 URL-REGEX ([057269d](https://github.com/geekdada/surgio/commit/057269dad5e7c176e3ee90dce9c071312354e772))


### Features

* 增加错误文案方便调试 ([ff28793](https://github.com/geekdada/surgio/commit/ff287933e17cb0f7d8f9b7d4a454124420e7610c))
* 增加了 Flag 识别字段 ([86c1489](https://github.com/geekdada/surgio/commit/86c14898001ab54b6a5387bf533c34d5917b4cbb))



## [0.11.4](https://github.com/geekdada/surgio/compare/v0.11.3...v0.11.4) (2019-10-10)


### Bug Fixes

* 不需要 sort ([51f560f](https://github.com/geekdada/surgio/commit/51f560fc86b24c1b4319a83637c90e5449023520))
* SSR URI 识别问题 ([46184fb](https://github.com/geekdada/surgio/commit/46184fbfdcd1583658db157123902862881413f5))



## [0.11.3](https://github.com/geekdada/surgio/compare/v0.11.2...v0.11.3) (2019-10-09)


### Bug Fixes

* 不手动指定不使用代理 ([d89198a](https://github.com/geekdada/surgio/commit/d89198a23cff4fe345f5597ab507b8680ac34b54))
* 文件名在 win 上取值错误 ([310518b](https://github.com/geekdada/surgio/commit/310518bd7cc37c2110dbcb50bdb1d5571bdb68cc))
* clash 规则不输出 ssr 节点名 ([7360c7b](https://github.com/geekdada/surgio/commit/7360c7b86a6f8adb151ba6270193e7c42a1f2069))



## [0.11.2](https://github.com/geekdada/surgio/compare/v0.11.1...v0.11.2) (2019-10-09)


### Bug Fixes

* clash 中 raw tcp 的节点没有 network 字段 ([56244c1](https://github.com/geekdada/surgio/commit/56244c1289cf663a71c898290d5a17bdb43c8109))



## [0.11.1](https://github.com/geekdada/surgio/compare/v0.11.0...v0.11.1) (2019-10-08)


### Features

* 远程片段支持读取原始内容 ([a1f9e0f](https://github.com/geekdada/surgio/commit/a1f9e0ff7f55b33f98934619a2e90c33ba0c8d20))
* add support for clashr ([43c4862](https://github.com/geekdada/surgio/commit/43c486277bdff42999f18a71a4627585461e4762))



# [0.11.0](https://github.com/geekdada/surgio/compare/v0.10.0...v0.11.0) (2019-10-08)


### Bug Fixes

* cannot assign value to read only object ([5bcbecd](https://github.com/geekdada/surgio/commit/5bcbecd1c5b647d20c5223131368cfe91a5ce7d2))


### Features

* 节点名补充国旗 Emoji ([dc1f34e](https://github.com/geekdada/surgio/commit/dc1f34e3616e924acc2773dc7024a5e968981d53))
* 增加国别判断字段 ([ce6828c](https://github.com/geekdada/surgio/commit/ce6828cdf80bd433d55ad788fac1529ef9b32fc6))
* add error message ([69b6bff](https://github.com/geekdada/surgio/commit/69b6bfffdca29c1d01cc77cf63730a12f7390822))
* custom filters ([d5ee8bc](https://github.com/geekdada/surgio/commit/d5ee8bc6b0066eb0d30699191fdcae6262bd4f1a))



# [0.10.0](https://github.com/geekdada/surgio/compare/v0.9.0...v0.10.0) (2019-10-04)


### Bug Fixes

* .snyk & package.json to reduce vulnerabilities ([33547e4](https://github.com/geekdada/surgio/commit/33547e40cd222bbbeadf1439eb139ddbb525c25c))
* add quote to user-agent ([e60ee8a](https://github.com/geekdada/surgio/commit/e60ee8a9607afe40d5cdd74127ceb1d98bcf85e0))


### Features

* native support for surge vmess ([02c063c](https://github.com/geekdada/surgio/commit/02c063c085f320f41945001a300e871fdb6ed9b8))



# [0.9.0](https://github.com/geekdada/surgio/compare/v0.8.0...v0.9.0) (2019-09-30)


### Bug Fixes

* v2ray json 应该区分本地端口 ([3a7cfe8](https://github.com/geekdada/surgio/commit/3a7cfe81e34549b6e538d0778f0f3e5adeda95fb))


### Features

* assign start port ([47bcf0e](https://github.com/geekdada/surgio/commit/47bcf0e0b67bf32ccffeaceb6966a560ee90235d))



# [0.8.0](https://github.com/geekdada/surgio/compare/v0.7.3...v0.8.0) (2019-09-26)


### Features

* add quantumultx filter ([0d01d55](https://github.com/geekdada/surgio/commit/0d01d55137eca6421253eeb99b404af22bb5d5e6))



## [0.7.3](https://github.com/geekdada/surgio/compare/v0.7.2...v0.7.3) (2019-09-16)



## [0.7.2](https://github.com/geekdada/surgio/compare/v0.7.1...v0.7.2) (2019-09-05)


### Features

* enhance filter ([2cb1d0a](https://github.com/geekdada/surgio/commit/2cb1d0adc25353f9bf0b33f45a530655cca56e4c))



## [0.7.1](https://github.com/geekdada/surgio/compare/v0.7.0...v0.7.1) (2019-09-04)


### Features

* 优化模板错误提示 ([a6cf815](https://github.com/geekdada/surgio/commit/a6cf815a23085bf47d872787ff85d96bdbfb3b3c))



# [0.7.0](https://github.com/geekdada/surgio/compare/v0.6.0...v0.7.0) (2019-09-02)


### Bug Fixes

* bin for v2ray ([fb2e4b9](https://github.com/geekdada/surgio/commit/fb2e4b95dfbf5c496597fe0ad629029e5dd6c8dd))
* filter got overwrote ([c4ad444](https://github.com/geekdada/surgio/commit/c4ad44408cbba0fb84a0a4e29a165ebdc7aca547))
* v2ray config ([fd315b4](https://github.com/geekdada/surgio/commit/fd315b447a2bce5db995ae0aac386dc1476b2765))


### Features

* output v2ray for surge ([172f97e](https://github.com/geekdada/surgio/commit/172f97ed52ae44a2a6c3ba26c6a0e27f4d0d8757))



# [0.6.0](https://github.com/geekdada/surgio/compare/v0.5.1...v0.6.0) (2019-08-30)


### Features

* surge 支持 ssr ([68b2966](https://github.com/geekdada/surgio/commit/68b2966e25219cc657ce21794f3f96415f73bae8))



## [0.5.1](https://github.com/geekdada/surgio/compare/v0.5.0...v0.5.1) (2019-08-29)



# [0.5.0](https://github.com/geekdada/surgio/compare/v0.4.0...v0.5.0) (2019-08-27)


### Bug Fixes

* double base64 ([853172d](https://github.com/geekdada/surgio/commit/853172d4737d7e63ecacd761a88ce274adc233c1))


### Features

* 生成 quan 订阅 scheme ([afe0a21](https://github.com/geekdada/surgio/commit/afe0a2120b0eeb048deab09c24964d7bd3e14a60))
* 生成 v2rayn scheme ([981e6d7](https://github.com/geekdada/surgio/commit/981e6d77517771da9510cc79c7e0cd8c7276d119))
* 支持导出 Quantumult 的 HTTPS, Shadowsocksr 节点 ([dd728e0](https://github.com/geekdada/surgio/commit/dd728e02345669751b31227327abb20034dc5554))
* add shadowsocks subscribe support ([e993d1b](https://github.com/geekdada/surgio/commit/e993d1bfa1ab4a50464ca37f647e22cd7c0bee68))
* add v2rayn subscribe support ([067ad43](https://github.com/geekdada/surgio/commit/067ad4318b456f5ceaf47ad78b79d206544da72e))
* clash 输出 vmess ([05cc557](https://github.com/geekdada/surgio/commit/05cc5570762d34a3465e71d14fbf78e8a30a1f34))



# [0.4.0](https://github.com/geekdada/surgio/compare/v0.3.1...v0.4.0) (2019-08-25)


### Features

* 初始化配置时使用 defaultsDeep ([ab8f695](https://github.com/geekdada/surgio/commit/ab8f695a79bbf92248a193805032c81fc2e31434))
* remote rule set ([a820cdb](https://github.com/geekdada/surgio/commit/a820cdb192daeb1f0a321e75ed447290b4e4207a)), closes [#5](https://github.com/geekdada/surgio/issues/5)



## [0.3.1](https://github.com/geekdada/surgio/compare/v0.3.0...v0.3.1) (2019-08-25)


### Bug Fixes

* build before publish ([b784fa5](https://github.com/geekdada/surgio/commit/b784fa5c948d51e394251a47e54767e1c5f25c8e))
* require pkg ([3081cc7](https://github.com/geekdada/surgio/commit/3081cc7bee460350e6b0d0768bf2cabe9a09f8d7))


### Features

* 模板 base64 filter ([3d45a23](https://github.com/geekdada/surgio/commit/3d45a23102cf642495e0920c91f2ed94de27a4e2))
* add cli update support ([2f2d340](https://github.com/geekdada/surgio/commit/2f2d340b0c4f65a1a601f62c2986c5384af6fd76))



# [0.3.0](https://github.com/geekdada/surgio/compare/v0.2.0...v0.3.0) (2019-08-25)


### Bug Fixes

* udp_over_tcp should be false ([302d445](https://github.com/geekdada/surgio/commit/302d445dc1af0e9debb41f016c08f64a849e2355))


### Features

* 属性判空 ([13eb455](https://github.com/geekdada/surgio/commit/13eb455d3258f0067a244117a50688817bdb1433))
* 在模板中暴露 nodeList 变量 ([c2eeb29](https://github.com/geekdada/surgio/commit/c2eeb295ff2ca7dc0407a2b67f8d1332aa26be60))
* 支持从 gui-config.json 中解析混淆配置 ([bc135a7](https://github.com/geekdada/surgio/commit/bc135a78c8eb0572ebc67b17ab9d7c6a9b4acf22))



# 0.2.0 (2019-08-21)



