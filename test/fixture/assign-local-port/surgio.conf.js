'use strict'

module.exports = {
  artifacts: [
    {
      name: 'v2rayn.conf',
      template: 'test',
      provider: 'v2rayn',
    },
    {
      name: 'ssr.conf',
      template: 'test',
      provider: 'ssr',
    },
  ],
  urlBase: 'http://example.com/',
  binPath: {
    shadowsocksr: '/usr/local/bin/ssr-local',
    v2ray: '/usr/local/bin/v2ray',
  },
}
