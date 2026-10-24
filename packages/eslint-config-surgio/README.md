<p align="center">
    <a href="https://surgio.js.org/" target="_blank">
        <img width="180" src="https://raw.githubusercontent.com/geekdada/surgio/master/docs/.vuepress/public/surgio-icon.png" alt="logo">
    </a>
</p>

<h2 align="center">eslint-config-surgio</h2>

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/@surgio/eslint-config-surgio.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@surgio/eslint-config-surgio
[download-image]: https://img.shields.io/npm/dm/@surgio/eslint-config-surgio.svg?style=flat-square
[download-url]: https://npmjs.org/package/@surgio/eslint-config-surgio

## 安装

```bash
pnpm add -D eslint @surgio/eslint-config-surgio
```

TypeScript parser 和兼容版本的 TypeScript 编译器由本包提供，规则仓库无需单独安装
`typescript`。

## 使用

在规则仓库中创建 `eslint.config.mjs`：

```js
import surgio from '@surgio/eslint-config-surgio'

export default surgio
```

默认配置支持 JavaScript，以及由 Node.js 22 直接运行的 `.ts`、`.mts` 和 `.cts`
文件。TypeScript lint 只检查语法和规则，不读取 `tsconfig.json`，也不会检查类型是否
正确；需要类型检查时请另外运行 `tsc --noEmit`。

## 文档

查看完整使用文档，前往 [surgio.js.org](https://surgio.js.org)。

## 交流

[<img width="207" src="https://raw.githubusercontent.com/geekdada/surgio/master/docs/.vuepress/public/join-telegram.png">](https://t.me/surgiotg)
