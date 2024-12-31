---
sidebarDepth: 0
---

# 常见问题

## 本地生成规则时报错

- `RequestError: connect ECONNREFUSED`
- `RequestError: connect ECONNRESET`

命令行默认不会通过代理请求，请在命令行内运行如下代码重试。端口号请根据自己的情况进行更改。

```bash
export https_proxy=http://127.0.0.1:6152;export http_proxy=http://127.0.0.1:6152;export all_proxy=socks5://127.0.0.1:6153
```

## 安装依赖时出现 `[warn]` 日志

可以忽略。

## 访问 now.sh 报错

![](/images/now-error.jpeg)

点击 _check the logs_，可以看到错误日志，截图后反馈至交流群。

Build logs 通常不会出错，如果没有看到错误请在 Functions 页面查看运行期错误。

![](/images/now-logs.png)

## 使用 `combineProviders` 后过滤器不生效

在使用合并 Provider 功能时，`combineProviders` 里 Provider 的过滤器 `customFilters`，`netflixFilter`，`youtubePremiumFilter` 不会生效，请在主 Provider 中定义它们。
