'use strict';

module.exports = {
  artifacts: [
    {
      name: 'test.conf',
      template: 'test',
      provider: 'ss',
      combineProviders: ['custom', 'clash'],
      proxyGroupModifier() {
        return [
          {
            name: 'select all',
            type: 'select',
          },
        ];
      },
    },
    {
      name: 'test2.conf',
      template: 'test',
      provider: 'rename',
      proxyGroupModifier() {
        return [
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
  gateway: {
    accessToken: 'abcd',
    auth: false,
  },
  surgeConfig: {
    v2ray: 'native',
  },
  quantumultXConfig: {},
  customFilters: {
    globalFilter: node => node.nodeName === '🇺🇸 US',
  },
};
