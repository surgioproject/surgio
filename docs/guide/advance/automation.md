---
title: 自动化更新规则仓库
sidebarDepth: 2
---

# 自动化更新规则仓库

## 前言

机场的订阅一天天变，如果每次更新我们都要打开电脑运行一次命令感觉太不科学了，所以需要引入自动化的管理。

我给出的自动化管理方案依赖 GitLab。首先，使用 Git 来管理你的规则仓库是本身就百利而无一害，比如方便回溯历史修改；再而，GitLab 提供了强大的 CI 系统，免费额度能够满足绝大多数需要；最后，GitLab 我比较熟悉（哈哈。为什么不用 GitHub，因为 Actions 功能还没有向所有人开放，第三方服务针对私有仓库几乎都要收费。

## 准备

1. 注册一个 [GitLab.com](https://gitlab.com) 账号
2. 新建一个私有的空仓库（什么都不要提交，也不要创建初始文件）
3. 电脑上安装好 Git

## 开始

这篇教程会以开篇时创建的那个初始仓库为例。为了能够下载到产物文件，你也需要开启 OSS 上传功能。

在目录里新建一个名为 `.gitignore` 的文件，内容如下：

```
.env
node_modules
dist
.DS_Store
```

:::tip
我们会让 Git 忽略生成规则的目录，因为通常 Git 仓库只保存源码而不保存产物或中间产物。我也建议你这么做。
:::

在 Terminal 中打开仓库目录，运行命令：

```bash
git init
```

新建一个名为 `.gitlab-ci.yml` 的文件，内容如下：

```yaml
image: node:10-stretch

before_script:
  - 'yarn install --production'

stages:
  - build

build:
  stage: build
  tags:
    - docker
  artifacts:
    paths:
      - dist/
  only:
    - web # 能够在网页上触发
    - triggers # 能够通过 API 触发
    - schedules # 能够定时触发
  script:
    - yarn update
```

接下来就是一些常规操作。熟悉一下 Git 操作，然后把代码提交到 remote。

## 配置 GitLab

当目录内存在 `.gitlab-ci.yml`，GitLab 便会自动打开 CI 功能。这里只需要配置一个自动化动作。

在 GitLab 项目页面，找到 Schedules。

![](https://dada-oss.dacdn.top/drops/CleanShot-2019-10-09-at-23.48.55-2x-5ZVwig2m1GUNFVB4qFnZ7ckRloLmbBUoleFpDYYg9XaFmvSwV31PtJZ2cf8oft2SUzmdfMX3AjOtzcqc9rwZwK3izHIQhECJtCje.png#3938bc27b05403fb9f320c7e786bb0c5afc28988f308fc5d8a6023d5d47b04bc)

点击 *New schedule* 添加一个新项目。

![](https://dada-oss.dacdn.top/drops/CleanShot-2019-10-09-at-23.46.43-2x-eKBypbXfkhREiSBO2R7otm90YLLTC8XgfxyXJ50WIdJWFFLtuwSXSL5Y1diSps5lW0yk6xCib1SaJfQ985kHJRghaVeMY7QelGN5.png#87f6eaf12abe116fb16174d185f617ad0831bc5f67ac8e29c593ab098bd61fb5)

保存即可。你的配置会在每天凌晨 4 点自动更新。你也可以配置自己的 Cron 规则，让它在任何时候自动触发更新。

:::warning
如果你使用 Surgio 来生成 Surge 使用的 Vmess 订阅，并且开启了 `external` 模式，就不能使用自动化管理。因为 Surgio 会在本地生成额外的文件，这对 Surge 来说是必须的。
:::

## 其他的触发方法

前面提到了，除了自动触发，CI 还支持在网页上触发或者接口触发。

### 网页触发

在左侧列表里找到 Pipelines，然后点击 *Run Pipeline*。接下来什么都不用做，直接点击 *Run Pipeline* 即可。通过这个渠道能够很方便地触发更新。

### 接口触发

假设我的仓库地址是 `https://gitlab.com/user/example`。则打开仓库设置 `https://gitlab.com/user/example/-/settings/ci_cd`。

找到 *Pipeline triggers*，点击右侧 *Expand*。输入名称后点击新建 Trigger。

![](https://dada-oss.dacdn.top/drops/CleanShot-2019-10-09-at-23.59.17-2x-sZLizB0clYjEzcHS1zJINVpfMS730PlW9ck6rXmbLIZjvcoEpYfeTqSYWUMNNjYq9ZYvCRn8bMa3gdam3jxtt9Jo3boaeO5UZkOq.png#396f166b9f13f4b76df6a3240a0b1a21ec8072e05cde3f5def31f2be8a0186cb)

:::tip
- `TOKEN` 即为上面一串长长的字符串
- `REF_NAME` 为 `master`
:::

使用例子中的调用方法进行调用，即可触发更新。你可以在「捷径」中配置一个 HTTP 请求操作，以后就能愉快地更新了。

![](https://dada-oss.dacdn.top/drops/concact-2019-10-10-001249-qx3IS0XgarjrAnnM8dGPzTLLsbS4Nun2KRHFVaAahzG2NphdZiaGVjC1xd8nDrgOBUNdLgDykyuWyuGgQPqMDhRDypMLxQE1dkBf.png#87b2672a6e064dcf02f5918bd08d464339fac76bfff4556cdcdc7b56407e88c5)

## 注意事项

1. 每一次本地修改都不要忘记提交到仓库
2. 切记仓库必须为私有
