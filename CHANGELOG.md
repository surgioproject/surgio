## [3.11.3](https://github.com/geekdada/surgio/compare/v3.11.2...v3.11.3) (2025-12-31)


### Features

* Add `nodeConfig.serverCertFingerprintSha256` as `fingerprint` for Trojan nodes in Clash ([0f3184c](https://github.com/geekdada/surgio/commit/0f3184c03000ed1fc25396c6a4c931fcb596f1f5)), closes [#311](https://github.com/geekdada/surgio/issues/311)
* destDirs ([6b1ceef](https://github.com/geekdada/surgio/commit/6b1ceefcee9e52e0d3d03cb4dd5be1702fba17d3))



## [3.11.2](https://github.com/geekdada/surgio/compare/v3.11.1...v3.11.2) (2025-09-14)


### Bug Fixes

* 修复 SIP002 解析逻辑，支持明文 AEAD-2022 和传统 Base64 格式 ([efd9bbb](https://github.com/geekdada/surgio/commit/efd9bbb1d5e03ab0611ae62476c646576bb94de0))



## [3.11.1](https://github.com/geekdada/surgio/compare/v3.11.0...v3.11.1) (2025-08-06)



# [3.11.0](https://github.com/geekdada/surgio/compare/v3.10.9...v3.11.0) (2025-07-25)



## [3.10.9](https://github.com/geekdada/surgio/compare/v3.10.8...v3.10.9) (2025-07-25)


### Features

* **sing-box:** Support portHopping and portHoppingInterval ([225c6e5](https://github.com/geekdada/surgio/commit/225c6e56c118edae75e17bc2c5d50835cb08d449))



## [3.10.8](https://github.com/geekdada/surgio/compare/v3.10.7...v3.10.8) (2025-07-09)


### Features

* Add germanyFilter and update youtubePremiumFilter ([a2bf19b](https://github.com/geekdada/surgio/commit/a2bf19ba9dd31a3052fee90cd5616317a668ecce))



## [3.10.7](https://github.com/geekdada/surgio/compare/v3.10.6...v3.10.7) (2025-03-11)


### Bug Fixes

* 处理 check 方法可能的错误情况 ([23684c4](https://github.com/geekdada/surgio/commit/23684c4afd39edaf45c5f845001dc7fad13ed823))



## [3.10.6](https://github.com/geekdada/surgio/compare/v3.10.5...v3.10.6) (2025-01-06)



## [3.10.5](https://github.com/geekdada/surgio/compare/v3.10.4...v3.10.5) (2024-12-31)


### Features

* Enable dual-stack resolving for ioredis ([d28922b](https://github.com/geekdada/surgio/commit/d28922b085effe65ff1edeac271042e01e4893dd))



## [3.10.4](https://github.com/geekdada/surgio/compare/v3.10.3...v3.10.4) (2024-12-31)



## [3.10.3](https://github.com/geekdada/surgio/compare/v3.10.2...v3.10.3) (2024-11-20)


### Bug Fixes

* clash wireguard config pre-shared-key key name wrong ([760af58](https://github.com/geekdada/surgio/commit/760af582352de2217c05959cdd433b4c895397eb))
* correct formatting of peers in Loon configuration ([096db3d](https://github.com/geekdada/surgio/commit/096db3dddb46b77349cbf3fb9daae3dfeb79bea3))
* distinguish pre-shared-key by clashCore ([f43be62](https://github.com/geekdada/surgio/commit/f43be6287329bc80a5717cf65b73b74abf76ebbb))
* update Loon node configuration to include keepalive and correct peers formatting ([76782f4](https://github.com/geekdada/surgio/commit/76782f4e8b01e2e0b609f6d9297cb83fb909518b))
* **utils:** HTTP(S) optional username & password ([805b93e](https://github.com/geekdada/surgio/commit/805b93e61943e9bebc477cf514f3e708fe4ab644))



## [3.10.2](https://github.com/geekdada/surgio/compare/v3.10.1...v3.10.2) (2024-09-21)



## [3.10.1](https://github.com/geekdada/surgio/compare/v3.10.0...v3.10.1) (2024-09-17)


### Bug Fixes

* Output correct port-hopping config for Surge ([ecc6901](https://github.com/geekdada/surgio/commit/ecc69018cbe8a001e4588e8b8e55261e46a756f6))


### Features

* Support port-hopping config from Clash subscription ([1869a1f](https://github.com/geekdada/surgio/commit/1869a1fd49fc41dec7575b802f25b3ac8998c301))



# [3.10.0](https://github.com/geekdada/surgio/compare/v3.9.3...v3.10.0) (2024-09-08)


### Features

* Add port hopping support to Clash and Surge config ([8d867cc](https://github.com/geekdada/surgio/commit/8d867cc036a2ccace8386ef2297c12866a4660b2))



## [3.9.3](https://github.com/geekdada/surgio/compare/v3.9.2...v3.9.3) (2024-08-12)


### Bug Fixes

* singbox wireguard ipv6 endpoint parsing; singbox test case ([b013657](https://github.com/geekdada/surgio/commit/b013657350cdb2ebf016b302c0eada884d018950))



## [3.9.2](https://github.com/geekdada/surgio/compare/v3.9.1...v3.9.2) (2024-06-30)


### Features

* **singbox:** Support network=tcp in VMESS/VLESS ([5e56602](https://github.com/geekdada/surgio/commit/5e5660283e77814229d5ec3043ee76146bf4880e))



## [3.9.1](https://github.com/geekdada/surgio/compare/v3.9.0...v3.9.1) (2024-06-11)


### Bug Fixes

* singbox ([2aea1c2](https://github.com/geekdada/surgio/commit/2aea1c2b52b2ee527831cbef6a8b2fed20034628))



# [3.9.0](https://github.com/geekdada/surgio/compare/v3.8.2...v3.9.0) (2024-05-22)


### Features

* support dialer-proxy and smux property in clash.meta config ([64c9575](https://github.com/geekdada/surgio/commit/64c957581e557213570fa1b43df3bb6682b00aba))



## [3.8.2](https://github.com/geekdada/surgio/compare/v3.8.1...v3.8.2) (2024-05-21)



## [3.8.1](https://github.com/geekdada/surgio/compare/v3.8.0...v3.8.1) (2024-05-09)



# [3.8.0](https://github.com/geekdada/surgio/compare/v3.7.1...v3.8.0) (2024-05-06)


### Features

* make resolveHostname a global option ([3b6f3a7](https://github.com/geekdada/surgio/commit/3b6f3a7f5a7c006ae25ab247c8f84d440c6105b2))



## [3.7.1](https://github.com/geekdada/surgio/compare/v3.7.0...v3.7.1) (2024-05-03)


### Features

* per proxy `test-timeout` for Surge nodes ([e4bee65](https://github.com/geekdada/surgio/commit/e4bee657bd6c091f4dbea06a8777cfd61e1c0c8f))



# [3.7.0](https://github.com/geekdada/surgio/compare/v3.7.0-beta.1...v3.7.0) (2024-05-03)


### Bug Fixes

* docs ([1ebb73e](https://github.com/geekdada/surgio/commit/1ebb73e4c1f11face1099e07b4ea5777329f5a77))



# [3.7.0-beta.1](https://github.com/geekdada/surgio/compare/v3.6.6...v3.7.0-beta.1) (2024-05-01)


### Features

* change how sing-box config is generated ([46d5faa](https://github.com/geekdada/surgio/commit/46d5faa86cdd35a0720471a7c53e5de4e22dce02))
* introduce sing-box support ([d6d9403](https://github.com/geekdada/surgio/commit/d6d94030e08fe64e8ccfd2e3afb0a1fd2b2daf42))



## [3.6.6](https://github.com/geekdada/surgio/compare/v3.6.5...v3.6.6) (2024-03-22)



## [3.6.5](https://github.com/geekdada/surgio/compare/v3.6.4...v3.6.5) (2024-03-18)


### Features

* allow setting ECN and blockQuic in provider config ([77f7ac9](https://github.com/geekdada/surgio/commit/77f7ac97d82c568930b343202d015fa885848f07))



## [3.6.4](https://github.com/geekdada/surgio/compare/v3.6.3...v3.6.4) (2024-03-18)


### Bug Fixes

* vless isn't available in custom provider ([06d3efd](https://github.com/geekdada/surgio/commit/06d3efdce91f596d0b4f2198ea78cf1e54b88c74))



## [3.6.3](https://github.com/geekdada/surgio/compare/v3.6.2...v3.6.3) (2024-03-17)


### Features

* add blockQuic option for surge ([23fed38](https://github.com/geekdada/surgio/commit/23fed3810c148c4254f221350110150bb7496027))



## [3.6.2](https://github.com/geekdada/surgio/compare/v3.6.1...v3.6.2) (2024-03-16)


### Bug Fixes

* vless + reality config lacks of client fingerprint ([7c66c01](https://github.com/geekdada/surgio/commit/7c66c01934c050db6097680226b7eb351cfe0cf0))



## [3.6.1](https://github.com/geekdada/surgio/compare/v3.6.0...v3.6.1) (2024-03-16)


### Bug Fixes

* Expand condition check to include Vless nodes in ClashProvider ([e2f54fc](https://github.com/geekdada/surgio/commit/e2f54fc33307386fc2dd48209a92c74a06754490))



# [3.6.0](https://github.com/geekdada/surgio/compare/v3.5.1...v3.6.0) (2024-03-16)


### Bug Fixes

* vmess cipher ([1618630](https://github.com/geekdada/surgio/commit/161863080b4cd5ce51a689ae458da6e6ad6bb59e))


### Features

* add clashConfig.enableVless ([050c0a3](https://github.com/geekdada/surgio/commit/050c0a33fc9794a8cc68823e02a1ec759b086415))
* add support for vless protocol ([960c851](https://github.com/geekdada/surgio/commit/960c851c49ce01bba54265d3a7239090e964691e))
* input and output vless configuration ([f09a66e](https://github.com/geekdada/surgio/commit/f09a66efe1c742dd89c95822e9f93cce7b2caa56))



## [3.5.1](https://github.com/geekdada/surgio/compare/v3.5.0...v3.5.1) (2024-03-05)


### Bug Fixes

* discard more than one HTTP headers from Vmess+HTTP when reading or outputting a Clash subscription ([ebed482](https://github.com/geekdada/surgio/commit/ebed482e38835e130e6f9c0fc7a4474b634811d7))



# [3.5.0](https://github.com/geekdada/surgio/compare/v3.4.3...v3.5.0) (2024-03-05)


### Bug Fixes

* console ([a5f59e9](https://github.com/geekdada/surgio/commit/a5f59e99631db853dbd87e0f4ee18b269664696f))


### Features

* add CLASH_META_SUPPORTED_RULE ([4e6f600](https://github.com/geekdada/surgio/commit/4e6f600ab947b769ac9760537eedbe004a3c026b))
* add new filters `clashMeta` and `stash` ([654ceba](https://github.com/geekdada/surgio/commit/654ceba8818a83e203eaddf5d9b56914462cb62f))
* add support for more VMESS transport protocol ([08b88b9](https://github.com/geekdada/surgio/commit/08b88b900f78de91b08f31f891f8fed52997d209))



## [3.4.3](https://github.com/geekdada/surgio/compare/v3.4.2...v3.4.3) (2024-02-17)


### Bug Fixes

* isClashMetaForAndroid ([9cd1b5d](https://github.com/geekdada/surgio/commit/9cd1b5de78df1bfb83061e6d54db2a51ae531005))



## [3.4.2](https://github.com/geekdada/surgio/compare/v3.4.1...v3.4.2) (2024-02-17)


### Features

* add isClashMetaForAndroid ([4e5f10d](https://github.com/geekdada/surgio/commit/4e5f10d633c03237a58a3b637dbb000da48c5e63))



## [3.4.1](https://github.com/geekdada/surgio/compare/v3.4.0...v3.4.1) (2024-02-04)


### Features

* add isClashVerge ([f371d55](https://github.com/geekdada/surgio/commit/f371d55d9f087245159825f2558e5a3a80535802))



# [3.4.0](https://github.com/geekdada/surgio/compare/v3.3.0...v3.4.0) (2024-02-03)


### Features

* **types:** ArtifactConfig add subscriptionUserInfoProvider ([ec18a1d](https://github.com/geekdada/surgio/commit/ec18a1d7a98e25f551cf60094a70025aa691a34e))



# [3.3.0](https://github.com/geekdada/surgio/compare/v3.2.3...v3.3.0) (2024-01-21)


### Features

* getClashNodeNames 增加默认节点 ([97b710a](https://github.com/geekdada/surgio/commit/97b710a4351e2846831dbad00cf28f2581972945))



## [3.2.3](https://github.com/geekdada/surgio/compare/v3.2.2...v3.2.3) (2023-12-15)


### Bug Fixes

* command hangs ([398a07b](https://github.com/geekdada/surgio/commit/398a07bc1682955cd864853da9f214ed91223364))
* remote snippets containing `IP-ASN` with `no-resolve` ([1b00a6c](https://github.com/geekdada/surgio/commit/1b00a6cc06f2d6b327551d2ab2e45142debc228d))


### Features

* **getLoonNodes:**  trojan support tfo and upd params ([c70581a](https://github.com/geekdada/surgio/commit/c70581a69be02c42ba078cfdb7dd0726086f9734))



## [3.2.2](https://github.com/geekdada/surgio/compare/v3.2.1...v3.2.2) (2023-11-05)


### Bug Fixes

* 上一个版本节点层级的客户端配置不生效 ([392d090](https://github.com/geekdada/surgio/commit/392d0904657d7b32af57ccca75fcc79bf3b4e809))



## [3.2.1](https://github.com/geekdada/surgio/compare/v3.2.0...v3.2.1) (2023-11-04)


### Features

* remove internal relay service ([88227d0](https://github.com/geekdada/surgio/commit/88227d0cba40296640997f8856b7155eb0ec6258))
* 优化了不同 Clash 核心的 Hysteria 密码兼容性问题 ([6f95489](https://github.com/geekdada/surgio/commit/6f954892b912ee5c50eaf8b7785a6d262c159cc9))



# [3.2.0](https://github.com/geekdada/surgio/compare/v3.1.0...v3.2.0) (2023-10-28)


### Features

* 新增判断 UserAgent 的工具方法 ([9a8d0f0](https://github.com/geekdada/surgio/commit/9a8d0f026cd72e3ce3aeee3f9566d19dd5c01733))



# [3.1.0](https://github.com/geekdada/surgio/compare/v3.0.2...v3.1.0) (2023-10-14)


### Features

* 支持 Hysteria 2 ([0603add](https://github.com/geekdada/surgio/commit/0603add012d07a37afb82dcb38f54a978a8395f6))



## [3.0.2](https://github.com/geekdada/surgio/compare/v3.0.1...v3.0.2) (2023-07-08)


### Bug Fixes

* Surge Wireguard 节点某些配置不生效的问题 ([30df8f9](https://github.com/geekdada/surgio/commit/30df8f945f0dc1f206e56c0aa3c5cf541665453d))



## [3.0.1](https://github.com/geekdada/surgio/compare/v3.0.0...v3.0.1) (2023-06-26)


### Bug Fixes

* forgot to include tuicFilter in template rendering context ([e141c0a](https://github.com/geekdada/surgio/commit/e141c0a27b7278515bc2db5876e4fa821fc74dfc))



# [3.0.0](https://github.com/geekdada/surgio/compare/v3.0.0-beta.1...v3.0.0) (2023-06-24)



# [3.0.0-beta.1](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.7...v3.0.0-beta.1) (2023-06-21)


### Bug Fixes

* use new cache prefix ([2a5fa34](https://github.com/geekdada/surgio/commit/2a5fa34cf5116b923ece09ca0c264014f98207fd))


### Features

* add new cache key ([4eec1b6](https://github.com/geekdada/surgio/commit/4eec1b6a5832a7fc80c8c1c6910906909a5a0982))
* new env SURGIO_RENDERED_ARTIFACT_CACHE_MAXAGE ([0be992d](https://github.com/geekdada/surgio/commit/0be992dcfb727ea7d4d7f7e9ba4a8385bd787a0b))



# [3.0.0-alpha.7](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.6...v3.0.0-alpha.7) (2023-06-19)


### Bug Fixes

* alterId shoud accept a number ([866b6cf](https://github.com/geekdada/surgio/commit/866b6cf2062d698f5c9911e9a07f33612b910cf8))
* 在模板中提供以下： ([6a4a728](https://github.com/geekdada/surgio/commit/6a4a728d7be3b9ca05dde8fea147b1dd511e9cc2))



# [3.0.0-alpha.6](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.5...v3.0.0-alpha.6) (2023-06-18)


### Bug Fixes

* 多个 peer 的 Wireguard 节点在 Surge 上的格式问题 ([17ec9c9](https://github.com/geekdada/surgio/commit/17ec9c93f3fa0b52acc1628f27c086dbb9e66bec))


### Features

* cache.wrap ([c34d661](https://github.com/geekdada/surgio/commit/c34d661903c913a473beb1a60ee02077ca8328d9))



# [3.0.0-alpha.5](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.4...v3.0.0-alpha.5) (2023-06-17)


### Bug Fixes

* wireguard for clash ([68e3e98](https://github.com/geekdada/surgio/commit/68e3e98af878ede032f85caa1499eea1e843bcb6))


### Features

* unify cache interface ([dc24a9b](https://github.com/geekdada/surgio/commit/dc24a9b6db50d70698243a17740f0a001b2bdb28))



# [3.0.0-alpha.4](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.3...v3.0.0-alpha.4) (2023-06-15)


### Features

* support Surge tuic-v5 format ([bedff82](https://github.com/geekdada/surgio/commit/bedff827094fdc68e106967be4237ed22afbcf5e))



# [3.0.0-alpha.3](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.2...v3.0.0-alpha.3) (2023-06-15)


### Bug Fixes

* dependency ([3636a4c](https://github.com/geekdada/surgio/commit/3636a4c27e46280c9ed6ea785b9e05f1bfd8f8dc))



# [3.0.0-alpha.2](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2023-06-15)


### Bug Fixes

* dependency ([e2791de](https://github.com/geekdada/surgio/commit/e2791de615060b57f5f563a3b76a28b70cc5eecc))



# [3.0.0-alpha.1](https://github.com/geekdada/surgio/compare/v3.0.0-alpha.0...v3.0.0-alpha.1) (2023-06-15)


### Bug Fixes

* port and version validation ([9c6c516](https://github.com/geekdada/surgio/commit/9c6c51684e6ec7ecd2ac9c1fda96ffb94bde5d6c))
* port validation ([0183428](https://github.com/geekdada/surgio/commit/0183428e830dd4899a3e2b93b221be5b51081d8d))
* snell version validation ([8af5aaf](https://github.com/geekdada/surgio/commit/8af5aaf5318f67c12d212165f81d93e170e5333a))


### Features

* improve error logs ([a695a5e](https://github.com/geekdada/surgio/commit/a695a5ea0bef53a32e32aed6d3b77a83e27b3f30))
* make sure properties of customParams are consistent ([e39692c](https://github.com/geekdada/surgio/commit/e39692c2417e2e1a3c6ca5adcdc2d3e5a64d8f3e))



# [3.0.0-alpha.0](https://github.com/geekdada/surgio/compare/v2.25.0...v3.0.0-alpha.0) (2023-05-31)


### Features

* add tuic v5 support ([39b5c94](https://github.com/geekdada/surgio/commit/39b5c940bd93c5a99537324eea03556c70bebdd3))
* address compatibility issues ([ceaecb4](https://github.com/geekdada/surgio/commit/ceaecb48082c60928f4b3a8f45611fcdb922806f))
* apply changes in [#226](https://github.com/geekdada/surgio/issues/226) ([3dd0135](https://github.com/geekdada/surgio/commit/3dd01358f0b1685f24ee397653eab70b16afb4c7))
* defineProvider 和 defineSurgioConfig ([ac81dc4](https://github.com/geekdada/surgio/commit/ac81dc4722f906dd0594d11ec5b0c3c5fb412e34))
* nodeConfig no longer has kebab naming properties ([43ea656](https://github.com/geekdada/surgio/commit/43ea656c5f53ff45776d76b620ee2e2547577ab6))
* re-organize package ([ea60904](https://github.com/geekdada/surgio/commit/ea60904554efa5d4560c397f60fdf8d567cadd13))
* remove all deprecated features ([7d76184](https://github.com/geekdada/surgio/commit/7d7618488bd83f719fbd2b63de078037df4b1981))
* reverseFilter and mergeReversedFilters ([5f643f6](https://github.com/geekdada/surgio/commit/5f643f684ef7311c8c0898343347f3e6ff1237d1))
* use mocha to test the CLI ([6ee4f93](https://github.com/geekdada/surgio/commit/6ee4f9331901c7874958a7d6194eecd7999e40e4))
* use zod to validate node configurations ([ab1d7fe](https://github.com/geekdada/surgio/commit/ab1d7fe1274ec3842b4d20dbe5a2b6be23396c2d))
* 优化 filter ([31c6fb2](https://github.com/geekdada/surgio/commit/31c6fb2bdfd0970a0cbf60fbb9c2475cd3537dd5))
* 优化 get*NodeNames ([53672ca](https://github.com/geekdada/surgio/commit/53672ca9c379d83843e501150f3263860d99ce5f))
* 支持多 Peer 配置 ([9756a73](https://github.com/geekdada/surgio/commit/9756a73f37f0371449f58785de42fc167adb78cc))
* 支持新版 Surge ([1103933](https://github.com/geekdada/surgio/commit/11039337a97b209323ec759bf132c958beda93b5))
* 新增 getSurgeWireguardNodes ([ac68299](https://github.com/geekdada/surgio/commit/ac682993daf572fcb7ec77613b626c731c22b50f))
* 新的模板方法 ([dd8cc7b](https://github.com/geekdada/surgio/commit/dd8cc7b55cd036b7f82639efc54443593e711f8c))
* 细化 getNodeNames；增加 Clash 的 shadow-tls 和 Wireguard 支持 ([1d477e6](https://github.com/geekdada/surgio/commit/1d477e6fe104ad1f23d6159eafedfc4530f26113))



# [2.25.0](https://github.com/geekdada/surgio/compare/v2.24.1...v2.25.0) (2023-02-12)


### Features

* add `underlyingProxy` support to `provider` ([7beca7c](https://github.com/geekdada/surgio/commit/7beca7ca451cbb058fafa53f3282d9403bb97d7c))
* add tuicFilter ([1dbac5f](https://github.com/geekdada/surgio/commit/1dbac5fa0afaf69c84aa98a3ba82d5f5c365650f))
* support underlyingProxy in CustomProvider ([754982c](https://github.com/geekdada/surgio/commit/754982ca7b295c9ff3150a9cf4c007ba71d840dc))



## [2.24.1](https://github.com/geekdada/surgio/compare/v2.24.0...v2.24.1) (2022-12-31)



# [2.24.0](https://github.com/geekdada/surgio/compare/v2.23.0...v2.24.0) (2022-11-30)


### Bug Fixes

* fixes [#210](https://github.com/geekdada/surgio/issues/210) ([fda604a](https://github.com/geekdada/surgio/commit/fda604ae3ea730bcce2af9a25c1e1fb9f3732868))


### Features

* add new config for surge ([509ab5a](https://github.com/geekdada/surgio/commit/509ab5a69fd41c3f8fb98b8469c33676593741f9))



# [2.23.0](https://github.com/geekdada/surgio/compare/v2.22.1...v2.23.0) (2022-10-21)


### Features

* add SURGIO_GFW_FREE environment variable ([2aaf242](https://github.com/geekdada/surgio/commit/2aaf242e92edfdc3bdebe4698d922943791d5160))
* add Tuic support for Clash (Stash) and Surge ([5bf51a6](https://github.com/geekdada/surgio/commit/5bf51a6869b46cf51fc8f693812556986581303e))



## [2.22.1](https://github.com/geekdada/surgio/compare/v2.22.0...v2.22.1) (2022-10-05)


### Reverts

* revert netlify setup ([c0c7d8a](https://github.com/geekdada/surgio/commit/c0c7d8a2539a47840fc0f4c3fb84aff0bda79b71))



# [2.22.0](https://github.com/geekdada/surgio/compare/v2.21.0...v2.22.0) (2022-10-04)


### Bug Fixes

* vuepress ([03acecf](https://github.com/geekdada/surgio/commit/03acecf4131ce316bd9ce20c0e4643e6679d7e7c))


### Features

* support getSurfboardNodes and surfboard vmess aead config ([4099f98](https://github.com/geekdada/surgio/commit/4099f988d019c3e7ab2fcbfe2313978fb353dfac))
* support surfboard rule format ([b7abfb2](https://github.com/geekdada/surgio/commit/b7abfb229466ceca8682f12acfb54a44c78805b7))



# [2.21.0](https://github.com/geekdada/surgio/compare/v2.20.1...v2.21.0) (2022-10-03)


### Features

* support QuantumultX server_check_url ([0919d00](https://github.com/geekdada/surgio/commit/0919d0045604910a069b3482168394d9a140ce46))



## [2.20.1](https://github.com/geekdada/surgio/compare/v2.20.0...v2.20.1) (2022-08-14)


### Bug Fixes

* getDownloadUrl and getUrl doesn't use viewerToken first ([c574642](https://github.com/geekdada/surgio/commit/c574642d81c7f620550b76e5896ae1999330022e))



# [2.20.0](https://github.com/geekdada/surgio/compare/v2.20.0-0...v2.20.0) (2022-06-30)



# [2.20.0-0](https://github.com/geekdada/surgio/compare/v2.19.0...v2.20.0-0) (2022-06-29)


### Features

* 支持 viewerToken 的配置 ([d7a74da](https://github.com/geekdada/surgio/commit/d7a74dafe83eed1a4977fb8206e0c3001eb2fc62))



# [2.19.0](https://github.com/geekdada/surgio/compare/v2.19.0-1...v2.19.0) (2022-06-12)


### Features

* useGlob, discardGlob ([119bdeb](https://github.com/geekdada/surgio/commit/119bdeb449cf23ebb0c3c00b54a506378263ddf8))



# [2.19.0-1](https://github.com/geekdada/surgio/compare/v2.19.0-0...v2.19.0-1) (2022-05-28)


### Bug Fixes

* hygen dependency ([75a8ac4](https://github.com/geekdada/surgio/commit/75a8ac458e8547e9d8b575d5813ad796b67445ee))



# [2.19.0-0](https://github.com/geekdada/surgio/compare/v2.18.4...v2.19.0-0) (2022-05-28)


### Features

* support Redis cache ([7d1ae46](https://github.com/geekdada/surgio/commit/7d1ae460f1466d0f4058c83db67fa176b1fba915))



## [2.18.4](https://github.com/geekdada/surgio/compare/v2.18.3...v2.18.4) (2022-05-26)


### Bug Fixes

* flag_cn.ts ([483c5b8](https://github.com/geekdada/surgio/commit/483c5b8e8134ba272597f9f1b2aa4e07783689ca))



## [2.18.3](https://github.com/geekdada/surgio/compare/v2.18.2...v2.18.3) (2022-05-21)


### Bug Fixes

* flag.test.ts ([52e23d0](https://github.com/geekdada/surgio/commit/52e23d09134a5c2ced2ec669fbad87636b12503c))


### Features

* Update flag_cn.ts ([478d694](https://github.com/geekdada/surgio/commit/478d6944a388727428cfd53f4fedf0134676fa94))



## [2.18.2](https://github.com/geekdada/surgio/compare/v2.18.1...v2.18.2) (2022-04-16)


### Bug Fixes

* wrong Trojan WSS config format for Quantumult X ([e953288](https://github.com/geekdada/surgio/commit/e953288911b62beeb0c431b53b4b28e72ce672d0))



## [2.18.1](https://github.com/geekdada/surgio/compare/v2.18.0...v2.18.1) (2022-04-15)


### Bug Fixes

* 流量查询工作不正常 ([95ea0dc](https://github.com/geekdada/surgio/commit/95ea0dc509c45bd9f5bf310795ce00cdf4942552))



# [2.18.0](https://github.com/geekdada/surgio/compare/v2.17.0...v2.18.0) (2022-04-13)


### Features

* support assign an user agent string to providers ([22ceb5d](https://github.com/geekdada/surgio/commit/22ceb5d4eb7845044313675c54a9676cef091962))



# [2.17.0](https://github.com/geekdada/surgio/compare/v2.16.0...v2.17.0) (2022-04-10)


### Features

* add useragent support ([a7ee722](https://github.com/geekdada/surgio/commit/a7ee72290f6d55e29d3c0c269abc61acc2cb2bfc))



# [2.16.0](https://github.com/geekdada/surgio/compare/v2.15.0...v2.16.0) (2022-03-19)


### Features

* format wsHeaders keys ([5c745fe](https://github.com/geekdada/surgio/commit/5c745fe1ff143e99b2ca6559e96c8969c8aad32d))
* support trojan websocket for loon ([63e66d6](https://github.com/geekdada/surgio/commit/63e66d612a6ce9f68bc2d0dfa6b0b616e00a548d))
* support trojan WebSocket for quantumultx generating ([5ded7b0](https://github.com/geekdada/surgio/commit/5ded7b01a246c4c2709087ef9e2734af554a839c))



# [2.15.0](https://github.com/geekdada/surgio/compare/v2.14.2...v2.15.0) (2022-03-18)


### Features

* add support for trojan web-socket config ([394f65d](https://github.com/geekdada/surgio/commit/394f65d927e3e8bae6237bea3bf3f2c644ed1a63))
* add tls-verification to quantumult x vmess config ([b24f071](https://github.com/geekdada/surgio/commit/b24f071f46a71a8446bd097d2c286b5011cb163b))



## [2.14.2](https://github.com/geekdada/surgio/compare/v2.14.1...v2.14.2) (2022-01-13)


### Bug Fixes

* encrypt-method=auto in Surge config ([4693bd4](https://github.com/geekdada/surgio/commit/4693bd4319bb6a0de172c0f9c4859f79792b915a))



## [2.14.1](https://github.com/geekdada/surgio/compare/v2.14.0...v2.14.1) (2022-01-12)


### Features

* re-enable Vmess AEAD on Surge ([602d999](https://github.com/geekdada/surgio/commit/602d9997cd3548631527631d8502f16a131c40dd))



# [2.14.0](https://github.com/geekdada/surgio/compare/v2.13.1...v2.14.0) (2022-01-11)


### Features

* add support for QuantumultX vmess AEAD config ([1e02c49](https://github.com/geekdada/surgio/commit/1e02c4917f740d9691d496a66d574669533d1091))



## [2.13.1](https://github.com/geekdada/surgio/compare/v2.13.0...v2.13.1) (2022-01-11)


### Bug Fixes

* back compatibility with Gateway ([39b266e](https://github.com/geekdada/surgio/commit/39b266e264926c71fa4fc37d30bda9ffcf4fd45d))



# [2.13.0](https://github.com/geekdada/surgio/compare/v2.12.0...v2.13.0) (2022-01-10)


### Features

* support surge vmess aead config ([628b999](https://github.com/geekdada/surgio/commit/628b99919b695c95d2d3e455ec955166155d3d33))



# [2.12.0](https://github.com/geekdada/surgio/compare/v2.11.0...v2.12.0) (2022-01-09)


### Features

* support new clash config format for vmess ([a3502bb](https://github.com/geekdada/surgio/commit/a3502bb6be259a54684536b1d3ea9e1cde27a622))



# [2.11.0](https://github.com/geekdada/surgio/compare/v2.10.3...v2.11.0) (2022-01-01)


### Features

* parse shadowsocks in V2rayN subscription ([e26fe15](https://github.com/geekdada/surgio/commit/e26fe154f4f9276c767270e28932210eb643222c)), closes [#167](https://github.com/geekdada/surgio/issues/167)
* support trojan subscription ([e241f4b](https://github.com/geekdada/surgio/commit/e241f4b1679006f90c20ec17b755de27bd6a4cf3))
* support trojan subscription ([75a90c4](https://github.com/geekdada/surgio/commit/75a90c4fb8867a870d3dc22d8ca9832e7ab1c2df))



## [2.10.3](https://github.com/geekdada/surgio/compare/v2.10.2...v2.10.3) (2021-11-24)



## [2.10.2](https://github.com/geekdada/surgio/compare/v2.10.1...v2.10.2) (2021-10-24)


### Bug Fixes

* wrong loon config format ([340d324](https://github.com/geekdada/surgio/commit/340d32412ab3c2694b4f6780930e32a5cf0735f0)), closes [#159](https://github.com/geekdada/surgio/issues/159)



## [2.10.1](https://github.com/geekdada/surgio/compare/v2.10.0...v2.10.1) (2021-08-27)


### Bug Fixes

* export necessary type ([21c717f](https://github.com/geekdada/surgio/commit/21c717f4b93a5b8d54cc61180f2771c590b4882c))



# [2.10.0](https://github.com/geekdada/surgio/compare/v2.9.1...v2.10.0) (2021-08-25)


### Bug Fixes

* lint error ([78efe78](https://github.com/geekdada/surgio/commit/78efe78ae7ea241183f900be2dfbe242fe699c1b))



## [2.9.1](https://github.com/geekdada/surgio/compare/v2.9.0...v2.9.1) (2021-07-22)


### Features

* add some utils ([05dae9c](https://github.com/geekdada/surgio/commit/05dae9c5664e42a95f97e9b9b232a3191491d889))



# [2.9.0](https://github.com/geekdada/surgio/compare/v2.8.0...v2.9.0) (2021-06-20)


### Bug Fixes

* eslint auto fix ([8b72414](https://github.com/geekdada/surgio/commit/8b724140f37467d8557195c7228079f152fe93b5))


### Features

* add new clash directives ([5a9f4dd](https://github.com/geekdada/surgio/commit/5a9f4dd6ad162eabe6e76b63588047ffb02a2d4c)), closes [#148](https://github.com/geekdada/surgio/issues/148)



# [2.8.0](https://github.com/geekdada/surgio/compare/v2.7.7...v2.8.0) (2021-03-10)


### Features

* add new util ([5d07aae](https://github.com/geekdada/surgio/commit/5d07aae9fa4c5e24e3c46b005fd0f6642aff31a9))
* support `test-url` for `getSurgeNodes` ([bd72082](https://github.com/geekdada/surgio/commit/bd72082471a5147627a17c8496bdb2b0d0ccedab))



## [2.7.7](https://github.com/geekdada/surgio/compare/v2.7.6...v2.7.7) (2021-02-16)



## [2.7.6](https://github.com/geekdada/surgio/compare/v2.7.5...v2.7.6) (2021-01-01)


### Bug Fixes

* fix [#135](https://github.com/geekdada/surgio/issues/135) ([f86af92](https://github.com/geekdada/surgio/commit/f86af925e160b49325f4595be0b40b5a39d1c1a4))


### Features

* 优化错误提示 ([6e882a4](https://github.com/geekdada/surgio/commit/6e882a454e8646db4b55b0a7399eb4cc0873d558))
* 优化错误提示 ([6690cd9](https://github.com/geekdada/surgio/commit/6690cd9257f943555fbe5c17b09af4168f6f4091))



## [2.7.5](https://github.com/geekdada/surgio/compare/v2.7.4...v2.7.5) (2020-12-11)


### Features

* 在生成 surge 的 ssr 订阅时强制校验 startPort ([879080b](https://github.com/geekdada/surgio/commit/879080b333d89aa7d37ebe6e646d78f71aa69af7))
* 调整了 dns 解析的参数 ([b7aa7eb](https://github.com/geekdada/surgio/commit/b7aa7ebf7b0bd71c85395fea0fc4c1295bbd84bc))



## [2.7.4](https://github.com/geekdada/surgio/compare/v2.7.3...v2.7.4) (2020-12-10)


### Bug Fixes

* simple-obfs in ss subscribe should be treated as obfs-local ([368c422](https://github.com/geekdada/surgio/commit/368c422360d28e06c10af03dddb56abdb7d5fbd0))



## [2.7.3](https://github.com/geekdada/surgio/compare/v2.7.2...v2.7.3) (2020-11-10)


### Features

* support gateway new config ([2e34d4b](https://github.com/geekdada/surgio/commit/2e34d4bff14c5aa0da8a5375da42869b36390a60))



## [2.7.2](https://github.com/geekdada/surgio/compare/v2.7.1...v2.7.2) (2020-11-09)


### Features

* will not remove dist folder before generating ([bb495ef](https://github.com/geekdada/surgio/commit/bb495efef42bb33242e7d16b6c087e0dedf75db2))



## [2.7.1](https://github.com/geekdada/surgio/compare/v2.7.0...v2.7.1) (2020-11-06)


### Bug Fixes

* dep source-map-support ([0700389](https://github.com/geekdada/surgio/commit/070038979c80e1e2c5c0a35af725685202a71ed4))



# [2.7.0](https://github.com/geekdada/surgio/compare/v2.6.1...v2.7.0) (2020-10-31)


### Bug Fixes

* config validationg ([b78f994](https://github.com/geekdada/surgio/commit/b78f9943a80d53f2b3ddd829b0c5b95d35cc02e3))
* lint ([2929deb](https://github.com/geekdada/surgio/commit/2929debeb30753eebcc8aa93f91b15f4c261ac51))


### Features

* load surgio remote snippets ([591cae2](https://github.com/geekdada/surgio/commit/591cae297f7442008b64ad1d8e695f304490bc98))



## [2.6.1](https://github.com/geekdada/surgio/compare/v2.6.0...v2.6.1) (2020-10-19)


### Bug Fixes

* dns test may failed on github ([36fe961](https://github.com/geekdada/surgio/commit/36fe9614216e82855dc8b6554f8a387c67ab6912))
* help option conflict with common-bin and yargs ([1f401c0](https://github.com/geekdada/surgio/commit/1f401c0934cf52e27ae7a09a40bbdc35ff24515b))



# [2.6.0](https://github.com/geekdada/surgio/compare/v2.5.2...v2.6.0) (2020-10-14)


### Features

* addLoonNodes ([6a5f0e3](https://github.com/geekdada/surgio/commit/6a5f0e379f17fd4bd4e5fa0dfafee738b07b7443)), closes [#123](https://github.com/geekdada/surgio/issues/123)
* dns resolve should have a timeout ([8ee0f4d](https://github.com/geekdada/surgio/commit/8ee0f4d7cd1138abef53433ee37e43c7ad4d1840))
* support loon rule format ([a0afec6](https://github.com/geekdada/surgio/commit/a0afec6e853f300bb37df38d629e55fccc3c5505))



## [2.5.2](https://github.com/geekdada/surgio/compare/v2.5.1...v2.5.2) (2020-09-30)


### Bug Fixes

* 覆盖内部国旗映射时顺序没有重置 ([0443bed](https://github.com/geekdada/surgio/commit/0443bede89a7bd3d209cc8b457152fd9428c02d3))



## [2.5.1](https://github.com/geekdada/surgio/compare/v2.5.0...v2.5.1) (2020-09-27)


### Bug Fixes

* Russia may be interpreted as the USA ([70db06d](https://github.com/geekdada/surgio/commit/70db06debdea3b4a33ee0c22a6cfac70ff6e31e3))



# [2.5.0](https://github.com/geekdada/surgio/compare/v2.4.0...v2.5.0) (2020-09-12)


### Features

* 支持去掉节点名称中的国旗 emoji ([7b363d6](https://github.com/geekdada/surgio/commit/7b363d6e0bf976ba8b70c803626d04db34592f5e))
* 支持用户自定义 emoji 替换规则 ([bce9ec5](https://github.com/geekdada/surgio/commit/bce9ec5b4df3ab88cbdf14d2197e0ec079dfb1c5))



# [2.4.0](https://github.com/geekdada/surgio/compare/v2.3.6...v2.4.0) (2020-09-06)


### Bug Fixes

* typo ([a13a571](https://github.com/geekdada/surgio/commit/a13a5710bf23814e640937fac1602465153dfe67))


### Features

* 允许通过命令行开启远程片段缓存 ([128c9c5](https://github.com/geekdada/surgio/commit/128c9c5998dcc8db9d4c9472ce451ff40f4732ee))
* 支持自定义订阅请求转发的地址 ([3f4fb3b](https://github.com/geekdada/surgio/commit/3f4fb3b7450e3e63d89d26b4dfcba7dffd1e683e))
* 清除缓存命令 ([4daaf1c](https://github.com/geekdada/surgio/commit/4daaf1cbd678ba65907e16dbfeb7c0aacf2d5cc2))



## [2.3.6](https://github.com/geekdada/surgio/compare/v2.3.5...v2.3.6) (2020-08-31)


### Bug Fixes

* clash vmess 配置中输出 udp ([d77f75c](https://github.com/geekdada/surgio/commit/d77f75c1650edfcad9f4ed6eb733b742d4d19cb9))



## [2.3.5](https://github.com/geekdada/surgio/compare/v2.3.4...v2.3.5) (2020-08-28)


### Bug Fixes

* the wrong US flag ([0bb6a60](https://github.com/geekdada/surgio/commit/0bb6a60b156a5fb967fdba058b88d879c2bff2a2)), closes [#115](https://github.com/geekdada/surgio/issues/115)



## [2.3.4](https://github.com/geekdada/surgio/compare/v2.3.3...v2.3.4) (2020-08-16)


### Features

* 支持指定阿里云 OSS endpoint ([1b796a5](https://github.com/geekdada/surgio/commit/1b796a5710de77194ea3c7b9de3ce74e147a1103))



## [2.3.3](https://github.com/geekdada/surgio/compare/v2.3.2...v2.3.3) (2020-08-16)


### Features

* 统一 UA ([83264f8](https://github.com/geekdada/surgio/commit/83264f8603d84ab872b3121f06e566ee0efedf0c))



## [2.3.2](https://github.com/geekdada/surgio/compare/v2.3.1...v2.3.2) (2020-08-08)


### Bug Fixes

* Taiwan should be enabled for youtube premium filter ([aa8ef4d](https://github.com/geekdada/surgio/commit/aa8ef4d4f60077d20dc6a6be0fd4f815429c04a5))


### Features

* Add chinaOutFilter ([b026b0d](https://github.com/geekdada/surgio/commit/b026b0d40abf6dbe79fe00ebc0803ad10d094b2c))



## [2.3.1](https://github.com/geekdada/surgio/compare/v2.3.0...v2.3.1) (2020-08-02)


### Bug Fixes

* 请求 clash 订阅时增加 ua header ([54b29ae](https://github.com/geekdada/surgio/commit/54b29aedbeb8904afe3da5329c7f2f4e1aeb8a64))



# [2.3.0](https://github.com/geekdada/surgio/compare/v2.2.1...v2.3.0) (2020-08-02)


### Features

* discard domains not resolvable ([71a26a8](https://github.com/geekdada/surgio/commit/71a26a820ad8cd9159b72668cc8a3b1e7a727616))
* ignore hostnames without corresponding ip ([ebe5a7d](https://github.com/geekdada/surgio/commit/ebe5a7d715b21f5a12bfbfcef00fdc06ebde9bf1))
* using global dns on github actions and gitlab ci ([042bbd1](https://github.com/geekdada/surgio/commit/042bbd1d7096f13fa9b60d1ba0068585b1648543))



## [2.2.1](https://github.com/geekdada/surgio/compare/v2.2.0...v2.2.1) (2020-07-26)


### Features

* change config key ([c904ec7](https://github.com/geekdada/surgio/commit/c904ec7380656a247954aa118d33694b1a0bf044))



# [2.2.0](https://github.com/geekdada/surgio/compare/v2.1.0...v2.2.0) (2020-07-26)


### Bug Fixes

* underlying-proxy in custom format ([938a550](https://github.com/geekdada/surgio/commit/938a5504cfc529a684b02ce52c66caff8ef97386))


### Features

* add process-name rule for clash config ([f518957](https://github.com/geekdada/surgio/commit/f518957086891eb908dc83e36ee3291bd0a3a994))
* add support surge underlying-proxy ([1a094fb](https://github.com/geekdada/surgio/commit/1a094fb925a072675da82eaa2fe5fe58f16e2fe4))
* add type checking ([ebafa30](https://github.com/geekdada/surgio/commit/ebafa30a4bc13d6a30b7dd55c60a1fb14b746ca8))



# [2.1.0](https://github.com/geekdada/surgio/compare/v2.0.0...v2.1.0) (2020-07-24)


### Bug Fixes

* crash when unwanted input ([3edfa1e](https://github.com/geekdada/surgio/commit/3edfa1e085bddb3065fc451c6390c4fc2b970243))


### Features

* support clash ssr native format ([47f6a1e](https://github.com/geekdada/surgio/commit/47f6a1e3285fbfd7e57ba2d0564f6feaf372d0ea))
* template function `snippet` ([602685e](https://github.com/geekdada/surgio/commit/602685e42a40125293343c53102a9866f2d30ed2))



# [2.0.0](https://github.com/geekdada/surgio/compare/v1.24.4...v2.0.0) (2020-07-12)


### chore

* remove gateway ([5cbbbba](https://github.com/geekdada/surgio/commit/5cbbbba7ce7c84087fdccf23d957d97c5346754f))
* upgrade deps and node version ([e3fc02b](https://github.com/geekdada/surgio/commit/e3fc02b83ec2627029b49d22e4d90451dc14e245))


### Features

* add support for ssd subscription ([46e5d2d](https://github.com/geekdada/surgio/commit/46e5d2d129b9b5470471594c432e8b5e2fc012ca))
* filter 行为修改 ([9e0ddf7](https://github.com/geekdada/surgio/commit/9e0ddf7118931009951dc1f21943d3340256885d))
* surgeconfig 默认值修改 ([7b004bd](https://github.com/geekdada/surgio/commit/7b004bd1cac6c490bd0dbb0c086f33ff85ac194e))
* udp-relay 改为强制布尔值 ([86a5dfc](https://github.com/geekdada/surgio/commit/86a5dfcb2343bff5dbfafd6cefe2057b2141c66e))
* Vmess 配置的 udp 改为 udp-relay ([9460bc8](https://github.com/geekdada/surgio/commit/9460bc8c1713a96fc61e4db271e599046d467830))
* 修改默认网络请求超时时间和重试次数 ([7753d20](https://github.com/geekdada/surgio/commit/7753d20611be1a4066747b3281d1ceb99a687ec1))
* 内置协议过滤器更名 ([6aa6531](https://github.com/geekdada/surgio/commit/6aa653174fd856c1ccc69ba10f5b995391ef9c82))


### BREAKING CHANGES

* 原有命名已不做支持
* useProviders, discardProviders 默认为严格模式
* 原有的字符串型 udp-relay 已不兼容
* Custom Provider 如果有使用到 Vmess，需要将 udp 改为 udp-relay，于其他类型节点统一
* Builtin gateway has been removed, please use @surgio/gateway
* Drop Node v10 support



## [1.24.4](https://github.com/geekdada/surgio/compare/v1.24.3...v1.24.4) (2020-07-03)


### Bug Fixes

* **utils:v2ray:** lack of transport settings ([4491e60](https://github.com/geekdada/surgio/commit/4491e60cb5e0709056d93c82d314d23ec482745a)), closes [#91](https://github.com/geekdada/surgio/issues/91)
* 配置 boolean 进行严格类型检查 ([1a42306](https://github.com/geekdada/surgio/commit/1a42306e5387b52b4a7f976b53b352c556607512))


### Features

* change mellow format ([20f7faf](https://github.com/geekdada/surgio/commit/20f7faf5294e1a932c2bb6e947ad735dcc1669af)), closes [#91](https://github.com/geekdada/surgio/issues/91)



## [1.24.3](https://github.com/geekdada/surgio/compare/v1.24.2...v1.24.3) (2020-06-21)


### Bug Fixes

* raw tcp over tls doesn't support tls13 in quantumultx format ([cb21447](https://github.com/geekdada/surgio/commit/cb21447f76583f79eb7c7c6b34fbb56efb00fbff))



## [1.24.2](https://github.com/geekdada/surgio/compare/v1.24.1...v1.24.2) (2020-06-19)


### Bug Fixes

* quantumultx should respect vmessConfig.udp ([73381f9](https://github.com/geekdada/surgio/commit/73381f915f8202cec5211ce608c7f8ec161f147f))
* v2rayn provider tls13 not effective ([50d60fb](https://github.com/geekdada/surgio/commit/50d60fb4bee4e835cec2c120c7d1344525099d7a))



## [1.24.1](https://github.com/geekdada/surgio/compare/v1.24.0...v1.24.1) (2020-06-19)



# [1.24.0](https://github.com/geekdada/surgio/compare/v1.23.4...v1.24.0) (2020-06-13)


### Bug Fixes

* surge script reformat incorrectly ([1f14408](https://github.com/geekdada/surgio/commit/1f14408f4c03e39ad18c136ef66ee445a2f6d4bf))


### Features

* add scheme check for v2rayn_subscribe ([37c820b](https://github.com/geekdada/surgio/commit/37c820ba7c254dd8b913b7ba46f61ed2734a4656))
* add tls13 config support to clash provider ([481c7e7](https://github.com/geekdada/surgio/commit/481c7e70125e2b4f31a753a636cc3091a1762153))
* add tls13 config support to v2rayn_subscribe provider ([233876e](https://github.com/geekdada/surgio/commit/233876e4b6f94237748345a09445cb766765b684))
* new protocol filters ([212892d](https://github.com/geekdada/surgio/commit/212892d0d14a361e69157918f9e784abf1312eb0))



## [1.23.4](https://github.com/geekdada/surgio/compare/v1.23.3...v1.23.4) (2020-05-29)


### Features

* 加入改变重试次数的环境变量 ([34ecfec](https://github.com/geekdada/surgio/commit/34ecfecd573bbe7d812821c0c60d8424035c5753))



## [1.23.3](https://github.com/geekdada/surgio/compare/v1.23.2...v1.23.3) (2020-05-17)


### Features

* change emoji rules ([a4f41e9](https://github.com/geekdada/surgio/commit/a4f41e9628384419ba97ca7e6706dbac4b6ae065))
* convert surge's new script format to quantumult x config ([9ddb8f5](https://github.com/geekdada/surgio/commit/9ddb8f5a5b185e2683e48eaf07c1023d73071659))



## [1.23.2](https://github.com/geekdada/surgio/compare/v1.23.1...v1.23.2) (2020-05-06)


### Bug Fixes

* 修复 now.sh 下运行的依赖问题 ([e413c60](https://github.com/geekdada/surgio/commit/e413c60d911095c25ed9cd99139f3bc6e6939a9b))



## [1.23.1](https://github.com/geekdada/surgio/compare/v1.23.0...v1.23.1) (2020-05-05)


### Bug Fixes

* eslint 修复文件未生效 ([0e41b77](https://github.com/geekdada/surgio/commit/0e41b77ee10d529a098859c8f7bae66264a819c5))



# [1.23.0](https://github.com/geekdada/surgio/compare/v1.22.0...v1.23.0) (2020-05-05)


### Bug Fixes

* **command:new:** 生成 custom 类型 provider 报错 ([be83268](https://github.com/geekdada/surgio/commit/be832687b0cb1a5ceb96e6742eb451e9ed5e5903))
* SSR URI 中包含 ipv6 地址解析错误 ([1cd8436](https://github.com/geekdada/surgio/commit/1cd8436a6335a4f018fc96532f297502cec8ce3b))
* 服务器地址为 ipv6 时触发解析 ([aa79c93](https://github.com/geekdada/surgio/commit/aa79c931bac1a81b2406e4c36180c62e064e0292))


### Features

* 支持解析 ipv6 地址 ([b96489b](https://github.com/geekdada/surgio/commit/b96489b6f92daa9e87f3863fb80e97b4af225fa6))
* 支持转换 surge ip-cidr6 至 quantumult x ip6-cidr ([c823677](https://github.com/geekdada/surgio/commit/c82367707e21ecd6856801a0e0d1758e58338a03))
* 生成规则前进行 eslint 检查 ([a769458](https://github.com/geekdada/surgio/commit/a769458225905b228ef8903da593ded2c42ab49d))



# [1.22.0](https://github.com/geekdada/surgio/compare/v1.21.1...v1.22.0) (2020-05-04)


### Bug Fixes

* 在配置了 vmess 的 host 的情况下，为 surge 增加 sni 参数 ([55cf85a](https://github.com/geekdada/surgio/commit/55cf85a89d0214717ae773755ec2f292549e6a04))


### Features

* useProviders 和 discardProviders 增加严格模式 ([bcd9fe9](https://github.com/geekdada/surgio/commit/bcd9fe942b9814ae453f4f13103245f8bf32384c))
* 优化未设置 binPath 的错误文案 ([f6d3e89](https://github.com/geekdada/surgio/commit/f6d3e895e783788c5f8b8bcf1622220f411b3e9a))
* 支持从 Clash 订阅中读取 v2ray-plugin mux 信息 ([f06f279](https://github.com/geekdada/surgio/commit/f06f2793af92f2a68aca51e461cad2c6b9165f5d))
* 更新内置默认 UA ([640ee2c](https://github.com/geekdada/surgio/commit/640ee2cddd392a97b61b9c5511335075bdb1b0ca))
* 错误信息补充 ([ef4946c](https://github.com/geekdada/surgio/commit/ef4946cac0eb9897586875118399624dbe44d8d9))



## [1.21.1](https://github.com/geekdada/surgio/compare/v1.21.0...v1.21.1) (2020-05-01)


### Bug Fixes

* doctor command throws error ([1635aaa](https://github.com/geekdada/surgio/commit/1635aaae0500730d75894dde56c638064a970703))



# [1.21.0](https://github.com/geekdada/surgio/compare/v1.20.2...v1.21.0) (2020-04-30)


### Features

* 增加 doctor 命令方便检查环境信息 ([14e9141](https://github.com/geekdada/surgio/commit/14e91418aec5485b3f0047604a4ea8871efee143))



## [1.20.2](https://github.com/geekdada/surgio/compare/v1.20.1...v1.20.2) (2020-04-24)


### Bug Fixes

* should not enable proxy on now.sh and heroku ([3713850](https://github.com/geekdada/surgio/commit/37138507c126d7b2da900c833fea2af0bf153f4d))
* 无法识别外部资源的 EOL ([bee0c12](https://github.com/geekdada/surgio/commit/bee0c1224781330c35a27cbfee4549d338de65d2))


### Features

* turn on keepalive for requesting remote resources ([5cdfeaf](https://github.com/geekdada/surgio/commit/5cdfeaf24b0eea4a3d12d4bcd264258e37e6969b))



## [1.20.1](https://github.com/geekdada/surgio/compare/v1.20.0...v1.20.1) (2020-04-17)



# [1.20.0](https://github.com/geekdada/surgio/compare/v1.19.0...v1.20.0) (2020-04-13)


### Bug Fixes

* artifact 配置应该允许其他 key ([efdde7d](https://github.com/geekdada/surgio/commit/efdde7d9daa762ad36769e5ea1f13e60f6cdf447))


### Features

* 允许直接定义 Artifact 的下载地址 ([bade49b](https://github.com/geekdada/surgio/commit/bade49b13b31a8fe6f35eedf72961c092ad8e83c))



# [1.19.0](https://github.com/geekdada/surgio/compare/v1.18.4...v1.19.0) (2020-04-11)


### Features

* add template method getUrl ([d02df8f](https://github.com/geekdada/surgio/commit/d02df8f2dbac0722381832944e06a11a3b0f3b40))
* 支持定义全局 customParams ([a8a092f](https://github.com/geekdada/surgio/commit/a8a092fc74c5fbb7fedaa3a00dbffe2f3e9e9432))



## [1.18.4](https://github.com/geekdada/surgio/compare/v1.18.3...v1.18.4) (2020-04-08)


### Bug Fixes

* change types definition ([ea9aaa3](https://github.com/geekdada/surgio/commit/ea9aaa38f78f67748d4f3cf14e585cc5abfd1188))



## [1.18.3](https://github.com/geekdada/surgio/compare/v1.18.2...v1.18.3) (2020-04-07)


### Features

* `v2rayn_subscribe` 支持强制覆盖 `skipCertVerify` 和 `udpRelay` ([3a326d4](https://github.com/geekdada/surgio/commit/3a326d463f47bba6a000d299eb1dee19d790e29c))
* add support for quantumultx tls1.3 ([007db56](https://github.com/geekdada/surgio/commit/007db568c2a9ac7685bd0a344fa5093c22429e81))
* 支持从 Surge 配置中解析转换 Quantumult X 的以下几种脚本 ([066060d](https://github.com/geekdada/surgio/commit/066060d3d26b6f0172c568897fc492a77ccfcfb9))



## [1.18.2](https://github.com/geekdada/surgio/compare/v1.18.1...v1.18.2) (2020-04-05)


### Bug Fixes

* sni is missing in surge trojan config ([be0c340](https://github.com/geekdada/surgio/commit/be0c34099b733fcda1f0baf5f85d1b19efb410b0))


### Features

* 优化国家地区识别 ([2d01be4](https://github.com/geekdada/surgio/commit/2d01be4b8a44bde120a5fef3533581469d93a8a8))



## [1.18.1](https://github.com/geekdada/surgio/compare/v1.18.0...v1.18.1) (2020-03-26)


### Features

* **Provider:**  v2rayn_subscribe add compatible mode ([534e883](https://github.com/geekdada/surgio/commit/534e883521f0dd0a1de47c04fa8473c1ec2b0912))



# [1.18.0](https://github.com/geekdada/surgio/compare/v1.17.1...v1.18.0) (2020-03-25)


### Features

* add a relay service for subscriptions ([4b789a8](https://github.com/geekdada/surgio/commit/4b789a89f1cf68ce978d0fecd58daaf82f4a039a))
* 更新模板生成工具 ([fd8eed0](https://github.com/geekdada/surgio/commit/fd8eed0b0f527698ec203f347d7bbdae397ee897))



## [1.17.1](https://github.com/geekdada/surgio/compare/v1.17.0...v1.17.1) (2020-03-23)


### Bug Fixes

* should now be able to get trojan config from clash subscriptions ([dfb9d5e](https://github.com/geekdada/surgio/commit/dfb9d5e58bf693461882c433a683e33c1f827d60))
* unable to parse trojan config in Clash subscription ([14a3cb7](https://github.com/geekdada/surgio/commit/14a3cb70c552b0505c8b09520ef38573536be47e))



# [1.17.0](https://github.com/geekdada/surgio/compare/v1.16.0...v1.17.0) (2020-03-22)


### Bug Fixes

* optimize error handling for Clash subscription ([5cdd916](https://github.com/geekdada/surgio/commit/5cdd9164ec6f6aa7bb51fb160b6aa1ca79e0514b))


### Features

* add a new command option `--skip-fail` for `surgio generate` ([3c5023e](https://github.com/geekdada/surgio/commit/3c5023eee728499b8cfd2c6c312628c8ee6360c5))
* add support for generating Trojan config for QuantumultX and Clash. ([f0c7936](https://github.com/geekdada/surgio/commit/f0c79363f6adb9476ef47b3428f4807088d1cf37))
* add support for snell v2 ([3afe5bd](https://github.com/geekdada/surgio/commit/3afe5bd1f4313f0f3ffc918ab9a8830b9c59200f))



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

* 支持为 mellow 输出 ss uri ([c26cdb5](https://github.com/geekdada/surgio/commit/c26cdb552a882cc7e29448cd0a1129c25a9bccc7))
* 支持加入自定义 trojan 节点 ([40b6714](https://github.com/geekdada/surgio/commit/40b67143fbf1f5e59cf5c4b08ef4eb62238f4678))
* 支持检查模板方法中无效的 filter ([9c2690b](https://github.com/geekdada/surgio/commit/9c2690b31d9266833e45c892fdad4daca6ce947e))



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

* Artifact 初始化后返回实例 ([7ca04cf](https://github.com/geekdada/surgio/commit/7ca04cfb07fa308abd90f475b1bd35ce58d183df))
* 为常用 Provider 类型增加订阅流量信息接口 ([ed68cab](https://github.com/geekdada/surgio/commit/ed68cab12a5417850229acbfa564a4436577e5cb))
* 修改 Artifact 初始化接口 ([4c3ac84](https://github.com/geekdada/surgio/commit/4c3ac847adae2bb492fa851e53b12213a6e379c7))
* 增加查询流量命令 ([a94eeab](https://github.com/geekdada/surgio/commit/a94eeab89b0a0c3432af2f9796d44e700084b93c))
* 支持从 SSR 订阅中读取剩余流量 ([fb2e886](https://github.com/geekdada/surgio/commit/fb2e886cac5428cdfac49bd6696a68e2494c2ea1))
* 支持在 Artifact 初始化时传入 Environment ([75ae51f](https://github.com/geekdada/surgio/commit/75ae51f3e9fafddade282d4348cbbcb9db774d36))



## [1.12.3](https://github.com/geekdada/surgio/compare/v1.12.2...v1.12.3) (2020-02-24)


### Bug Fixes

* external provider 的 addresses 参数只应该写 IP ([f7006d6](https://github.com/geekdada/surgio/commit/f7006d676317db5eb0b6aac66440f9a76f7d8db4))
* 某些情况下 v2ray 配置 port 为字符串 ([b8af4d7](https://github.com/geekdada/surgio/commit/b8af4d799d70d02c5b4361954f38625afd891973)), closes [#59](https://github.com/geekdada/surgio/issues/59)


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

* useProviders, discardProviders ([e11cb75](https://github.com/geekdada/surgio/commit/e11cb75d3d58189e9dacc2c4f699e514ab1a33c1)), closes [#51](https://github.com/geekdada/surgio/issues/51)
* 支持 Clash 的 Provider 片段 ([5c42328](https://github.com/geekdada/surgio/commit/5c4232809e60514121c1579deaa8ce9dbd151323))
* 支持新的 Clash 规则配置方法 ([48b90e1](https://github.com/geekdada/surgio/commit/48b90e142dcd5c200ddd1b1e4cae8b6e97d918bb))



## [1.10.1](https://github.com/geekdada/surgio/compare/v1.10.0...v1.10.1) (2019-12-29)


### Features

* remove speed test command ([47dfaa0](https://github.com/geekdada/surgio/commit/47dfaa0e2914bd7e1f9c96e90e4afe4a5f17d303))



# [1.10.0](https://github.com/geekdada/surgio/compare/v1.9.0...v1.10.0) (2019-12-29)


### Bug Fixes

* broken test ([25fcde6](https://github.com/geekdada/surgio/commit/25fcde69365ca66dfcce3fe260a1c6e2d0bd57b3))
* LRU 缓存可能会被污染 ([929f7bd](https://github.com/geekdada/surgio/commit/929f7bd3a32adc40eb23ec782eba1ce2978569d8))
* Provider 组合后生成结果排序错乱 ([d051b28](https://github.com/geekdada/surgio/commit/d051b2851ff401038587baa88f0e5ddc134471bc))
* 在 external 中开启 tfo 和 mptcp 是没有意义的 ([8b0e6f0](https://github.com/geekdada/surgio/commit/8b0e6f07b35da4a6d0ab7164c1dd572e387b8b90))


### Features

* v2ray-plugin 强制输出 mux: false ([ba635c5](https://github.com/geekdada/surgio/commit/ba635c599065a88d5ba9d0fcd94a1f4939140da1))
* 域名解析失败后跳过 ([66f5af8](https://github.com/geekdada/surgio/commit/66f5af8d31416591a29e28ac8ae03d978fa50862))
* 支持从 Clash 订阅中读取 skipCertVerify ([c856731](https://github.com/geekdada/surgio/commit/c856731cec14246b1ced594627daa5c50a2959cd))
* 支持配置 Provider 缓存 ([16dc8fc](https://github.com/geekdada/surgio/commit/16dc8fce9911fee2cae2e8c12e8649d3ede44dfa))



# [1.9.0](https://github.com/geekdada/surgio/compare/v1.8.5...v1.9.0) (2019-12-25)


### Bug Fixes

* test ([6cb39d8](https://github.com/geekdada/surgio/commit/6cb39d822ec02d9237a5420866bb544e09c76f26))


### Features

* add support for v2ray-plugin ([118a94a](https://github.com/geekdada/surgio/commit/118a94a531afb2353b61dcb698fd52b23d22df07))



## [1.8.5](https://github.com/geekdada/surgio/compare/v1.8.4...v1.8.5) (2019-12-11)


### Features

* 支持修改节点名 ([4437f0e](https://github.com/geekdada/surgio/commit/4437f0e628d13ae5f675b04aa0b7e44b66bc37a7))
* 更新 netflixFilter ([515cbe5](https://github.com/geekdada/surgio/commit/515cbe5a179f6a7a364dc4e0eba72f264fb82b57))
* 更新国旗数据库 ([18f22d2](https://github.com/geekdada/surgio/commit/18f22d213e90fc9f680323439cbe4082ea2b171b))



## [1.8.4](https://github.com/geekdada/surgio/compare/v1.8.3...v1.8.4) (2019-12-10)


### Bug Fixes

* Ruleset 中 IP-CIDR6 的处理不当 ([edee2bd](https://github.com/geekdada/surgio/commit/edee2bd3de6a3154f651629b780319533bd5445b))



## [1.8.3](https://github.com/geekdada/surgio/compare/v1.8.2...v1.8.3) (2019-12-04)


### Bug Fixes

* broken test ([794be85](https://github.com/geekdada/surgio/commit/794be85268811ab665351ab255f368bc4a6d0754))
* 在某些情况下 Clash 的策略组中没输出 url 和 interval ([3884014](https://github.com/geekdada/surgio/commit/3884014c2296a59de90ae5f5e4803a3609f7893d))



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

* 优化 dns 解析 ([345790e](https://github.com/geekdada/surgio/commit/345790eecd6b2f4745b91999004d921f41b259bc))
* 在模板中输出 proxyTestUrl ([b95cd8b](https://github.com/geekdada/surgio/commit/b95cd8b157e902a920699618cf1e61d1f615fd31))
* 网关 get-artifact 支持直接输出 surge 和 qx 的节点列表 ([97f78c4](https://github.com/geekdada/surgio/commit/97f78c49ba3eeb050361807e2cbbfc44523f0804))



# [1.5.0](https://github.com/geekdada/surgio/compare/v1.4.3...v1.5.0) (2019-11-18)


### Bug Fixes

* 某些情况下 clash 配置没有输出 interval 和 url ([1978429](https://github.com/geekdada/surgio/commit/197842956a96fd35b91afd77cf358c1697ac7097))
* 空文件不会返回 404 ([271c398](https://github.com/geekdada/surgio/commit/271c398df29e8e3da2f4f22d6aa2d78aa49f122c))


### Features

* nodeFilter 也支持过滤排序 ([6dd7f66](https://github.com/geekdada/surgio/commit/6dd7f665d26ad427f026786d5add8c578084f816))
* 增加规则过滤关键词 ([128f648](https://github.com/geekdada/surgio/commit/128f64835ccde09b4b0dda54e4075dc0218fbc10))
* 支持在输出 external 时解析域名 ([1f78f44](https://github.com/geekdada/surgio/commit/1f78f44dde2949e384184d8fa59f566a45ed2d64))
* 支持排序类型的过滤器 ([db69447](https://github.com/geekdada/surgio/commit/db694473b1b88e44811971fbc0cd8761d0fcf4e3))



## [1.4.3](https://github.com/geekdada/surgio/compare/v1.4.2...v1.4.3) (2019-11-15)


### Bug Fixes

* 某些情况下 Provider 中的 customFilters 未生效 ([48f1b32](https://github.com/geekdada/surgio/commit/48f1b321a2c4fbc6859b67a8975f1c9529bfaa20))



## [1.4.2](https://github.com/geekdada/surgio/compare/v1.4.1...v1.4.2) (2019-11-14)


### Features

* Provider 处理改为并发 ([8bf2738](https://github.com/geekdada/surgio/commit/8bf2738f14f9d30b9bfbf6999fbbdf91a5993469))
* 优化远程片段获取的并发请求 ([7552fa0](https://github.com/geekdada/surgio/commit/7552fa05b073871aa6a50472f2386bfa4fa9421d))



## [1.4.1](https://github.com/geekdada/surgio/compare/v1.4.0...v1.4.1) (2019-11-13)


### Bug Fixes

* clash 策略名错误 ([9f2eaac](https://github.com/geekdada/surgio/commit/9f2eaacb851a2b993412ae30be8946a9408df87a))



# [1.4.0](https://github.com/geekdada/surgio/compare/v1.3.5...v1.4.0) (2019-11-13)


### Bug Fixes

* Close [#35](https://github.com/geekdada/surgio/issues/35) ([491b655](https://github.com/geekdada/surgio/commit/491b655bc8061ed120ab119bd5e4ac57859ea095))
* 由于 mellow 对 shadowsocks 支持有限，忽略该类型节点 ([8ae0561](https://github.com/geekdada/surgio/commit/8ae056194b938014eee4c0bebfb38ecf3de7cb10))


### Features

* 可配置 Clash 的 proxy test url ([89b0b92](https://github.com/geekdada/surgio/commit/89b0b926a5ee5011f9b11cfe4d0a0c745c9ca890))
* 增加 mellow 规则处理方法 ([b646199](https://github.com/geekdada/surgio/commit/b646199507d7558bd00daa89f4877501391e2605))
* 支持 Clash 的 'fallback-auto', 'load-balance' 策略 ([18f106f](https://github.com/geekdada/surgio/commit/18f106fee8c94c01bbf8a4a34fadfcd9557fdd2b)), closes [#34](https://github.com/geekdada/surgio/issues/34)
* 支持单独定义某个 artifact 的输出目录 ([bef00c7](https://github.com/geekdada/surgio/commit/bef00c7d9894476c695229a6e96f1d3f47fd91b1))
* 支持在 surgio.conf.js 中定义全局 customFilters ([1701b85](https://github.com/geekdada/surgio/commit/1701b85d68e487b52fb529243d8826ee4b5a99a8))
* 支持导出 Mellow 节点 ([9a72ca2](https://github.com/geekdada/surgio/commit/9a72ca2ac7b9b59ee3c1b61180fd8fe915330ad8))



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

* check command ([2db635f](https://github.com/geekdada/surgio/commit/2db635ff91cd786daa6852abdd82896ab213f3ab))
* 面板增加添加 Clash 的按钮 ([b66e5f3](https://github.com/geekdada/surgio/commit/b66e5f31dae975ccac83742666ea7385a6e023e0))



## [1.3.2](https://github.com/geekdada/surgio/compare/v1.3.1...v1.3.2) (2019-11-05)


### Features

* youtubePremiumFilter 增加新加坡 ([7b32873](https://github.com/geekdada/surgio/commit/7b32873ff906156208ae7a03ea8002534a794c57))
* youtubePremiumFilter 增加香港 ([821bf3c](https://github.com/geekdada/surgio/commit/821bf3c653767490bf093e0980be091b28f3501d))



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

* udp-relay 的值改为布尔类型，兼容字符串类型 ([f3eaaed](https://github.com/geekdada/surgio/commit/f3eaaed03727de525e12a454a8a966fd923f8d89))
* 仅支持读取 ws 和 tcp 类型的 vmess 节点 ([de5bb35](https://github.com/geekdada/surgio/commit/de5bb35fcc3b4b4e6bb1bb12a6cc6f53bd6de2c8))
* 新增 getQuantumultXNodes ([d284d04](https://github.com/geekdada/surgio/commit/d284d0415e9524dffebd73d6085d1e11ceef3621))
* 节点增加 tfo 参数 ([a820b89](https://github.com/geekdada/surgio/commit/a820b89590ac3379ccf109539000783b0d7b803a))



## [1.2.1](https://github.com/geekdada/surgio/compare/v1.2.0...v1.2.1) (2019-11-01)


### Bug Fixes

* 遗漏了一种 clash 的 ss 混淆格式 ([4791328](https://github.com/geekdada/surgio/commit/4791328076b68b01d2b3c64da3738339238c2938))



# [1.2.0](https://github.com/geekdada/surgio/compare/v1.1.1...v1.2.0) (2019-11-01)


### Bug Fixes

* protoparam 和 obfsparam 中不能有空格 ([6cdb978](https://github.com/geekdada/surgio/commit/6cdb97880913a594115a59d49bfebcf90c555f7f))
* 加国旗正确识别中转节点了 ([3751dbf](https://github.com/geekdada/surgio/commit/3751dbf0f7f0d8619cfa28b2ec2cc8c24c4494a7))


### Features

* proxyGroupModifier 支持 filter 和 proxies 组合 ([ba0f0c6](https://github.com/geekdada/surgio/commit/ba0f0c6bee8a14490c0124a7ff0773e636fd27e4))
* 不合法 yaml 文件识别 ([1654534](https://github.com/geekdada/surgio/commit/16545347613026a57bac46eb286e52f894384c11))
* 允许用户覆盖 clash 订阅的 udp 转发支持 ([bb58c50](https://github.com/geekdada/surgio/commit/bb58c50aa5334ea9ce1ee4c323aa531dcbb32e79))
* 兼容v2rayn 订阅格式 ([8ba4625](https://github.com/geekdada/surgio/commit/8ba4625955bfb068028303a56148ac20e109e6e3))
* 增加 netflixFilter 规则 ([5cc52f1](https://github.com/geekdada/surgio/commit/5cc52f1c237b9c4fcf2dee56ea3c0caaf82695ad))
* 支持读取 Clash 订阅 ([45ef59f](https://github.com/geekdada/surgio/commit/45ef59f359e21e37f5dac242a33888c74ec1afbc))



## [1.1.1](https://github.com/geekdada/surgio/compare/v1.1.0...v1.1.1) (2019-10-29)


### Features

* better error message ([26fcaa3](https://github.com/geekdada/surgio/commit/26fcaa3310046fbd886cff2370a8bf31be96dcca))
* gateway request log ([891168b](https://github.com/geekdada/surgio/commit/891168b6a702a0440b5d0475a25d11345d594f52))
* quick editing from list-artifact ([2d1d605](https://github.com/geekdada/surgio/commit/2d1d605fe5dd36332a8f04476d397cb7a14b6684))
* 新增过滤器 discardKeywords ([b9f0ecb](https://github.com/geekdada/surgio/commit/b9f0ecb97366835a71862cd8f032048322266336))



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

* getNodeNames 和 getClashNodeNames 不再过滤 nodeType ([6571511](https://github.com/geekdada/surgio/commit/6571511f3d30aa3a283a69b81afb9aa548031b18))
* schema validation for config ([9f11254](https://github.com/geekdada/surgio/commit/9f11254d2bc7107e2299e1146553b03da1e9849f))
* schema validation for provider ([d738e0f](https://github.com/geekdada/surgio/commit/d738e0f999c91f577deb14793889210620757f36))
* 合并 Provider 接口定义 ([f197e19](https://github.com/geekdada/surgio/commit/f197e198aaf826b91af6896d02046c15976e4962))



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

* 增加了 Flag 识别字段 ([86c1489](https://github.com/geekdada/surgio/commit/86c14898001ab54b6a5387bf533c34d5917b4cbb))
* 增加错误文案方便调试 ([ff28793](https://github.com/geekdada/surgio/commit/ff287933e17cb0f7d8f9b7d4a454124420e7610c))



## [0.11.4](https://github.com/geekdada/surgio/compare/v0.11.3...v0.11.4) (2019-10-10)


### Bug Fixes

* SSR URI 识别问题 ([46184fb](https://github.com/geekdada/surgio/commit/46184fbfdcd1583658db157123902862881413f5))
* 不需要 sort ([51f560f](https://github.com/geekdada/surgio/commit/51f560fc86b24c1b4319a83637c90e5449023520))



## [0.11.3](https://github.com/geekdada/surgio/compare/v0.11.2...v0.11.3) (2019-10-09)


### Bug Fixes

* clash 规则不输出 ssr 节点名 ([7360c7b](https://github.com/geekdada/surgio/commit/7360c7b86a6f8adb151ba6270193e7c42a1f2069))
* 不手动指定不使用代理 ([d89198a](https://github.com/geekdada/surgio/commit/d89198a23cff4fe345f5597ab507b8680ac34b54))
* 文件名在 win 上取值错误 ([310518b](https://github.com/geekdada/surgio/commit/310518bd7cc37c2110dbcb50bdb1d5571bdb68cc))



## [0.11.2](https://github.com/geekdada/surgio/compare/v0.11.1...v0.11.2) (2019-10-09)


### Bug Fixes

* clash 中 raw tcp 的节点没有 network 字段 ([56244c1](https://github.com/geekdada/surgio/commit/56244c1289cf663a71c898290d5a17bdb43c8109))



## [0.11.1](https://github.com/geekdada/surgio/compare/v0.11.0...v0.11.1) (2019-10-08)


### Features

* add support for clashr ([43c4862](https://github.com/geekdada/surgio/commit/43c486277bdff42999f18a71a4627585461e4762))
* 远程片段支持读取原始内容 ([a1f9e0f](https://github.com/geekdada/surgio/commit/a1f9e0ff7f55b33f98934619a2e90c33ba0c8d20))



# [0.11.0](https://github.com/geekdada/surgio/compare/v0.10.0...v0.11.0) (2019-10-08)


### Bug Fixes

* cannot assign value to read only object ([5bcbecd](https://github.com/geekdada/surgio/commit/5bcbecd1c5b647d20c5223131368cfe91a5ce7d2))


### Features

* add error message ([69b6bff](https://github.com/geekdada/surgio/commit/69b6bfffdca29c1d01cc77cf63730a12f7390822))
* custom filters ([d5ee8bc](https://github.com/geekdada/surgio/commit/d5ee8bc6b0066eb0d30699191fdcae6262bd4f1a))
* 增加国别判断字段 ([ce6828c](https://github.com/geekdada/surgio/commit/ce6828cdf80bd433d55ad788fac1529ef9b32fc6))
* 节点名补充国旗 Emoji ([dc1f34e](https://github.com/geekdada/surgio/commit/dc1f34e3616e924acc2773dc7024a5e968981d53))



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

* add shadowsocks subscribe support ([e993d1b](https://github.com/geekdada/surgio/commit/e993d1bfa1ab4a50464ca37f647e22cd7c0bee68))
* add v2rayn subscribe support ([067ad43](https://github.com/geekdada/surgio/commit/067ad4318b456f5ceaf47ad78b79d206544da72e))
* clash 输出 vmess ([05cc557](https://github.com/geekdada/surgio/commit/05cc5570762d34a3465e71d14fbf78e8a30a1f34))
* 支持导出 Quantumult 的 HTTPS, Shadowsocksr 节点 ([dd728e0](https://github.com/geekdada/surgio/commit/dd728e02345669751b31227327abb20034dc5554))
* 生成 quan 订阅 scheme ([afe0a21](https://github.com/geekdada/surgio/commit/afe0a2120b0eeb048deab09c24964d7bd3e14a60))
* 生成 v2rayn scheme ([981e6d7](https://github.com/geekdada/surgio/commit/981e6d77517771da9510cc79c7e0cd8c7276d119))



# [0.4.0](https://github.com/geekdada/surgio/compare/v0.3.1...v0.4.0) (2019-08-25)


### Features

* remote rule set ([a820cdb](https://github.com/geekdada/surgio/commit/a820cdb192daeb1f0a321e75ed447290b4e4207a)), closes [#5](https://github.com/geekdada/surgio/issues/5)
* 初始化配置时使用 defaultsDeep ([ab8f695](https://github.com/geekdada/surgio/commit/ab8f695a79bbf92248a193805032c81fc2e31434))



## [0.3.1](https://github.com/geekdada/surgio/compare/v0.3.0...v0.3.1) (2019-08-25)


### Bug Fixes

* build before publish ([b784fa5](https://github.com/geekdada/surgio/commit/b784fa5c948d51e394251a47e54767e1c5f25c8e))
* require pkg ([3081cc7](https://github.com/geekdada/surgio/commit/3081cc7bee460350e6b0d0768bf2cabe9a09f8d7))


### Features

* add cli update support ([2f2d340](https://github.com/geekdada/surgio/commit/2f2d340b0c4f65a1a601f62c2986c5384af6fd76))
* 模板 base64 filter ([3d45a23](https://github.com/geekdada/surgio/commit/3d45a23102cf642495e0920c91f2ed94de27a4e2))



# [0.3.0](https://github.com/geekdada/surgio/compare/v0.2.0...v0.3.0) (2019-08-25)


### Bug Fixes

* udp_over_tcp should be false ([302d445](https://github.com/geekdada/surgio/commit/302d445dc1af0e9debb41f016c08f64a849e2355))


### Features

* 在模板中暴露 nodeList 变量 ([c2eeb29](https://github.com/geekdada/surgio/commit/c2eeb295ff2ca7dc0407a2b67f8d1332aa26be60))
* 属性判空 ([13eb455](https://github.com/geekdada/surgio/commit/13eb455d3258f0067a244117a50688817bdb1433))
* 支持从 gui-config.json 中解析混淆配置 ([bc135a7](https://github.com/geekdada/surgio/commit/bc135a78c8eb0572ebc67b17ab9d7c6a9b4acf22))



# 0.2.0 (2019-08-21)



