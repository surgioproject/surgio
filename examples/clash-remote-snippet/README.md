# Example - Clash

该样例生成的规则可以用于所有的 Clash 客户端。

在这个案例中，引用了 [神机规则](https://github.com/ConnersHua/Profiles/tree/master/Surge)，你也可以用相似的方法引用其它的远程片段。需要注意的是，我们只能引用 Surge 的远程片段，而非 QuantumultX 的规则。

对于 `Apple` 和 `Apple CDN` 这两个策略组，我强烈建议你使用内置的 `apple_rules.tpl`，它可以很好的解决苹果服务接口的访问和苹果全球 CDN 的访问分流。想了解更多细节可以阅读 [这篇文章](https://blog.dada.li/2019/better-proxy-rules-for-apple-services)。
