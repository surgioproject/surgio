'use strict';

const nock = require('nock');
const fs = require('fs');
const path = require('path');

const toBase64 = (str) => Buffer.from(str, 'utf8').toString('base64');

const scope = nock('http://example.com')
  .get(/\/gui-config\.json/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/gui-config-1.json'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/test-ss-sub\.txt/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/test-ss-sub.txt'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/test-ssr-sub\.txt/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/test-ssr-sub.txt'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/test-v2rayn-sub\.txt/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/test-v2rayn-sub.txt'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/test-v2rayn-sub-compatible\.txt/)
  .reply(
    200,
    fs.readFileSync(
      path.join(__dirname, '../asset/test-v2rayn-sub-compatible.txt'),
      {
        encoding: 'utf8',
      },
    ),
  )
  .get(/\/netflix\.list/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/netflix.list'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/telegram\.list/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/telegram.list'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/clash-sample\.yaml/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/clash-sample.yaml'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/clash-sample-with-user-info\.yaml/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/clash-sample.yaml'), {
      encoding: 'utf8',
    }),
    {
      'subscription-userinfo':
        'upload=891332010; download=29921186546; total=322122547200; expire=1586330887',
    },
  )
  .get(/\/test-ruleset\.list/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/test-ruleset-1.list'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/ForeignMedia\.list/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/ForeignMedia.list'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/surgio-snippet\.tpl/)
  .reply(
    200,
    fs.readFileSync(path.join(__dirname, '../asset/surgio-snippet.tpl'), {
      encoding: 'utf8',
    }),
  )
  .get(/\/ssd-sample\.txt/)
  .reply(
    200,
    `ssd://${toBase64(
      fs.readFileSync(path.join(__dirname, '../asset/ssd-sample.json'), {
        encoding: 'utf8',
      }),
    )}`,
  )
  .get(/\/ssd-sample-2\.txt/)
  .reply(
    200,
    `ssd://${toBase64(
      fs.readFileSync(path.join(__dirname, '../asset/ssd-sample-2.json'), {
        encoding: 'utf8',
      }),
    )}`,
  )
  .get(/\/error/)
  .reply(500, '');

scope.persist();
