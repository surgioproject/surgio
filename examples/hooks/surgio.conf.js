'use strict'

const { defineSurgioConfig } = require('surgio')

module.exports = defineSurgioConfig({
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
      name: 'Clash.yaml',
      template: 'clash',
      provider: 'demo',
      combineProviders: ['error'],
    },
  ],
  urlBase: 'https://config.example.com/',
  // https://surgio.js.org/guide/custom-config.html#upload
  // upload: {},
})
