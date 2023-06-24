'use strict'

const { utils } = require('surgio')

module.exports = {
  remoteSnippets: [
    {
      name: 'youtube',
      url: 'https://raw.githubusercontent.com/geekdada/surge-list/master/youtube.list',
    },
    {
      name: 'global',
      url: 'https://git.royli.dev/me/lhie1_Rules/raw/branch/master/Surge/Surge%203/Provider/Proxy.list',
    },
    {
      name: 'netflix',
      url: 'https://git.royli.dev/me/lhie1_Rules/raw/branch/master/Surge/Surge%203/Provider/Media/Netflix.list',
    },
  ],
  artifacts: [
    {
      name: 'QuantumultX_rules.conf',
      template: 'quantumultx_rules',
      provider: 'demo',
    },
    {
      name: 'QuantumultX.conf',
      template: 'quantumultx',
      provider: 'demo',
    },
    {
      name: 'Quantumult_subscribe_us.conf',
      template: 'quantumult_subscribe',
      provider: 'demo',
      customParams: {
        magicVariable: utils.usFilter,
      },
    },
    {
      name: 'Quantumult_subscribe_hk.conf',
      template: 'quantumult_subscribe',
      provider: 'demo',
      customParams: {
        magicVariable: utils.hkFilter,
      },
    },
  ],
  urlBase: 'https://config.example.com/',
  // https://surgio.js.org/guide/custom-config.html#upload
  // upload: {},
}
