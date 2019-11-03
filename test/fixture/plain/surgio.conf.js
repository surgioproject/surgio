'use strict';

module.exports = {
  artifacts: [
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
      template: 'test',
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
      name: 'template-functions.conf',
      template: 'template-functions',
      provider: 'ss',
      combineProviders: ['custom', 'ss_json', 'v2rayn', 'clash', 'ssr_with_udp'],
    },
  ],
  urlBase: 'https://example.com/',
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
    v2ray: '/usr/local/bin/v2ray',
  },
  gateway: {
    accessToken: 'abcd',
  },
  surgeConfig: {
    v2ray: 'native',
  },
};
