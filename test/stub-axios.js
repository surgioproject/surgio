'use strict';

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const fs = require('fs');
const path = require('path');

const mock = new MockAdapter(axios);

mock.onGet(/\/gui-config\.json/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/gui-config-1.json'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/test-ss-sub\.txt/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/test-ss-sub.txt'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/test-ssr-sub\.txt/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/test-ssr-sub.txt'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/test-v2rayn-sub\.txt/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/test-v2rayn-sub.txt'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/netflix\.list/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/netflix.list'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/telegram\.list/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/telegram.list'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/clash-sample\.yaml/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/clash-sample.yaml'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/test-ruleset\.list/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/test-ruleset-1.list'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/ForeignMedia\.list/).reply(
  200,
  fs.readFileSync(path.join(__dirname, 'asset/ForeignMedia.list'), {
    encoding: 'utf8',
  })
);
mock.onGet(/\/error/).reply(
  500,
  ''
);

mock.onAny().passThrough();
