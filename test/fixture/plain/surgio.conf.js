'use strict';

const path = require('path');

module.exports = {
  artifacts: [
    {
      name: 'new_path.conf',
      template: 'test',
      provider: 'ss_json',
      destDir: path.join(__dirname, './dist'),
    },
    {
      name: 'ss_json.conf',
      template: 'test',
      provider: 'ss_json',
    },
    {
      name: 'ss.conf',
      template: 'test',
      provider: 'ss',
    },
    {
      name: 'ssr.conf',
      template: 'test',
      provider: 'ssr',
    },
    {
      name: 'v2rayn.conf',
      template: 'template-functions',
      provider: 'v2rayn',
    },
    {
      name: 'custom.conf',
      template: 'test',
      provider: 'custom',
    },
    {
      name: 'ss_clash.conf',
      template: 'test',
      provider: 'clash',
    },
    {
      name: 'clash_mod.conf',
      template: 'template-functions',
      provider: 'clash_mod',
    },
    {
      name: 'ssd.conf',
      template: 'test',
      provider: 'ssd',
    },
    {
      name: 'template-functions.conf',
      template: 'template-functions',
      provider: 'ss',
      combineProviders: ['custom', 'ss_json', 'v2rayn', 'clash', 'ssr_with_udp', 'ssd'],
      customParams: {
        globalVariableWillBeRewritten: 'barbar',
        subLevel: {
          anotherVariableWillBeRewritten: 'another-value',
        },
      },
      proxyGroupModifier() {
        return [
          {
            name: 'auto all',
            type: 'url-test',
          },
          {
            name: 'select all',
            type: 'select',
          },
        ];
      },
    },
  ],
  urlBase: 'https://example.com/',
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
    v2ray: '/usr/local/bin/v2ray',
  },
  flags: {
    '🚀': '火箭',
    '🎉': [/foobar/i],
  },
  gateway: {
    accessToken: 'abcd',
  },
  surgeConfig: {
    v2ray: 'native',
  },
  customFilters: {
    globalFilter: node => node.nodeName === '测试中文',
    unused: () => true,
  },
  customParams: {
    globalVariable: 'foo',
    globalVariableWillBeRewritten: 'bar',
    subLevel: {
      anotherVariableWillBeRewritten: 'value',
    },
  },
  proxyTestUrl: 'http://www.google.com/generate_204',
  proxyTestInterval: 2400,
};
