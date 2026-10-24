<p align="center">
    <a href="https://surgio.js.org/" target="_blank">
        <img width="180" src="https://raw.githubusercontent.com/geekdada/surgio/master/docs/.vuepress/public/surgio-icon.png" alt="logo">
    </a>
</p>

<h2 align="center">Logger</h2>

[![NPM version][npm-image]][npm-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/@surgio/logger.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@surgio/logger
[snyk-image]: https://snyk.io/test/npm/@surgio/logger/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/@surgio/logger
[download-image]: https://img.shields.io/npm/dm/@surgio/logger.svg?style=flat-square
[download-url]: https://npmjs.org/package/@surgio/logger

`@surgio/logger` provides the same timestamped console logger in Node.js and
Web-standard Edge Worker runtimes. Its runtime is based on `consola/core` and
does not require Node compatibility shims.

```ts
import { createLogger, setLogLevel } from '@surgio/logger'

const logger = createLogger({ service: 'surgio:worker' })

setLogLevel('debug')
logger.info('loaded %s', 'configuration')
```

The initial level comes from `SURGIO_LOG_LEVEL` when `process.env` is
available, and otherwise defaults to `info`. Supported levels are `silent`,
`error`, `warn`, `info`, and `debug`.

Version 2 removes the Winston-specific `transports` export. Use
`setLogLevel()` to update every existing and future logger.

## 文档

查看完整使用文档，前往 [surgio.js.org](https://surgio.js.org)。

## 交流

[<img width="207" src="https://raw.githubusercontent.com/geekdada/surgio/master/docs/.vuepress/public/join-telegram.png">](https://t.me/surgiotg)
