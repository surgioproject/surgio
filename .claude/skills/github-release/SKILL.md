---
name: github-release
description: 在 lerna 打完 tag 之后，为 Surgio monorepo 创建或更新 GitHub Release，并编写中文更新说明。用于用户要求“创建 release”“发 GitHub Release”“写 release notes / changelog”，或者 `pnpm release` / `lerna version` 已经执行完毕的场景。
---

# 创建 GitHub Release

这个 skill 只处理 GitHub Release。版本号、tag 和 CHANGELOG 由 `lerna version` 生成，npm 发布由 `lerna publish from-git` 完成，这两步都不在本 skill 内执行。

## 1. 确认 tag

```bash
git fetch --tags -q
git tag --points-at HEAD
git ls-remote origin 'refs/tags/<tag>^{}'   # 对每个 tag 都执行一次
```

- HEAD 不是 `chore(release): new release`，或者 HEAD 上没有 tag：停下，告诉用户先执行 `lerna version`。不要自己打 tag，因为 tag 格式和 CHANGELOG 由 lerna 统一生成。
- 某个 tag 在 origin 上不存在，或者 `^{}` 解析出的 commit 不是 HEAD：停下。`gh release create` 遇到远端不存在的 tag 时，会在默认分支的最新 commit 上新建一个同名 tag。
- 一定要带 `^{}`。lerna 打的是 annotated tag，不带 `^{}` 时，`ls-remote` 返回的是 tag 对象的 hash，不是 commit 的 hash。

## 2. 决定 release 的 tag、标题和动作

```
本次 tag 中有 surgio@<v> 吗？
├── 没有 → 停下，问用户是否需要 release、挂在哪个 tag 上
└── 有 → 只做一个 release：tag 是 surgio@<v>，标题是 v<v>
         其它包写进正文的“本次发布的包”表格
         gh release view 'surgio@<v>' 能查到吗？
         ├── 能 → 动作是“更新”：先读出现有正文，在此基础上修改，第 7 步改用 edit
         └── 不能 → 动作是“创建”
```

仓库历史上只给 surgio 建过 release（`v3.19.0`、`v4.0.0`）。本次 tag 里没有 surgio 时，不要套用这条规则去猜。

## 3. 查 npm 状态，决定 release 状态

对第 1 步得到的每个 tag 都查一次。直接请求 registry，不要用 `npm view`，因为它会读本地缓存：

```bash
for tag in $(git tag --points-at HEAD); do
  name="${tag%@*}"; version="${tag##*@}"
  echo "$tag $(curl -s -o /dev/null -w '%{http_code}' "https://registry.npmjs.org/${name/\//%2f}/$version")"
done
```

```
全部返回 200 吗？
├── 否 → 用 --draft，并告诉用户哪些版本还没发布
│        正文会引导用户安装新版本，npm 上没有的版本装不上
└── 是 → 版本号带 -beta、-alpha 或 -rc 吗？
         ├── 是 → 用 --prerelease，不加 --latest
         └── 否 → 用 --latest
```

## 4. 确定变更范围

基线是上一个同类 release。本次的 tag 不能当作基线，即使它的 release 已经存在：

```bash
gh release list --limit 20 --json tagName,isPrerelease,isDraft,publishedAt
```

```
这次是正式版吗？
├── 是 → 基线是本次 tag 之前最近的一个 release，且不能是草稿或预发布
│        例如 v4.0.0 的基线是 v3.19.0
│        基线之后的所有预发布版本都要汇总进来
└── 否 → 基线是本次 tag 之前最近的一个 release，预发布版本也算
```

正式版必须汇总整个 beta 周期，因为 CHANGELOG 中 4.0.0 这一节只记录了 beta.11 之后的改动。

基线 release 只属于 surgio。其它包按时间截断：读 `CHANGELOG.md` 中日期晚于基线 `publishedAt` 的所有小节。例如 v3.19.0 发布于 2026-08-12，gateway-frontend 就从 2.3.1 之后开始读。

素材有以下三类，正文中的每一条都必须能在里面找到依据，素材里没有的功能、兼容结论和数字一律不写：

1. `packages/*/CHANGELOG.md` 中上面这些小节，包括 Features、Bug Fixes 和 BREAKING CHANGES。
2. 大版本时还要读 `docs/guide/upgrade-guide-v<major>.md` 的“新特性”和“破坏性变化”两节。破坏性变化取它和 CHANGELOG 中 BREAKING CHANGES 的并集，因为升级指南没有收录 CLI 命令删除、Gateway 导出变化、ESLint 版本要求这类条目。
3. CHANGELOG 的某一行看不懂时，用它附带的 hash 执行 `git show <hash>`。不要用 `git log <基线>..<tag> -- packages/...`，因为 v3 时代源码在根目录 `src/`，这个 pathspec 会漏掉大部分 commit。

汇总正式版时，下面两类条目不写：

- 修复的是基线之后才新增的功能。例如 beta 期间新增的 Worker 出了 bug，后来又修好了。
- 只在 beta 之间发生的 API 变化。例如某个 beta 新增了 `resolveSecret`，下一个 beta 又删掉了。

原因：从基线升级的用户从没碰到过这些问题，写出来只会让人误以为自己受影响。

## 5. 编写正文

正文用中文写。Project、Provider、Artifact、Gateway、Worker、`clashCore` 这类名词保持和文档一致，不翻译。正文写到 `mktemp` 创建的临时文件里，不要用 tag 拼文件名，因为 `@surgio/...` 里的 `/` 会变成目录。

结构如下。有箭头注释的小节按注释决定是否保留；没有注释的小节，没有内容时删掉：

```markdown
<一两句话说明这个版本解决了什么问题。大版本要链接升级指南>

## 本次发布的包                     ← 只有一个包时删掉
| 包 | 版本 |

<兼容要求，一句话，例如“Surgio v4 需要搭配 @surgio/gateway v3”>   ← 大版本或包之间兼容要求变化时保留
<安装命令代码块>                     ← 与上一行同时保留或同时删掉

## 主要变化
- **<客户端或模块>**：<用户现在能做什么>   ← 按领域分组，不按 commit 分组

## 修复
- <用户以前遇到的问题>，<现在的表现>

## 破坏性变化
- <变了什么>，<用户需要改哪个字段、命令或环境变量>
完整列表见[升级指南](...)           ← 有升级指南时保留

## 升级方式                         ← 只在大版本保留

各个包的详细变更见对应的 CHANGELOG：   ← 始终保留，列出本次的每个包
- [<pkg>](https://github.com/surgioproject/surgio/blob/<URL 编码后的 tag>/packages/<dir>/CHANGELOG.md)

**Full Changelog**: https://github.com/surgioproject/surgio/compare/<基线 tag>...<本次 tag>   ← 始终保留
```

写作规则：

- 写用户能感知到的变化，不写实现细节。例如写“Surge 支持输出 VLESS 节点”，不写“新增 formatVlessNode”，因为读者是配置仓库的维护者。
- `test`、`docs`、`chore`、`ci` 类提交不写，除非它改变了用户的操作。例如升级指南新增了必须执行的步骤，就要写。
- 每条破坏性变化都要写出用户需要改的字段、命令或环境变量名。只写“行为有调整”，用户无法判断自己是否受影响。
- 配置校验从宽松变严格时，例如以前能生成、现在直接报错的情况，写进破坏性变化，不写进修复。原因是升级后原来的配置会失败。
- 不写 commit hash 和作者。这些信息在 CHANGELOG 和 compare 链接里都有。
- 不用 emoji，不用“重磅”“全新”“大幅提升”这类词。
- 文档链接用 `https://surgio.js.org/guide/...`，锚点直接写中文标题。
- 仓库链接一律用 `github.com/surgioproject/surgio`，包括从文档里抄来的 `geekdada/surgio` 链接。`surgioproject` 是正式组织名，旧地址只是靠重定向才能打开。

## 6. 校验

- 正文里的每个 CHANGELOG 路径都要在本地存在，用 `ls packages/*/CHANGELOG.md` 核对。
- compare 链接两端的 tag 都要能在 origin 上查到，用 `git ls-remote`。
- 版本表格和 `git tag --points-at HEAD` 的结果要逐一对上，不能多也不能少。
- 安装命令里的每个版本范围，都必须落在对应 `package.json` 的 `peerDependencies` 范围内。peer 范围里还带着预发布版本时，例如 `^4.0.0-beta.9`，在最后的汇报中告诉用户，但不要在这个 skill 里修改。
- 正文里的每个站内锚点，都要在对应文档中有同名标题，用 `grep -n '^#' docs/...` 核对。

## 7. 创建或更新

```bash
# 第 2 步判断为“创建”时
gh release create '<tag>' --verify-tag --title 'v<version>' \
  --notes-file "$notes" [--draft | --prerelease | --latest]

# 第 2 步判断为“更新”时（先执行过 gh release view '<tag>' --json body -q .body）
gh release edit '<tag>' --notes-file "$notes"

gh release list --limit 3
```

`--verify-tag` 的作用是在 tag 不存在时直接报错，避免命令自己新建 tag。

如果建的是草稿，把 npm 发布后转为正式 release 的命令交给用户：`gh release edit '<tag>' --draft=false --latest`。
