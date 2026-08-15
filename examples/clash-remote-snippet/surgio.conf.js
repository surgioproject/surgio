'use strict'

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
      name: 'Clash.yaml',
      template: 'clash',
      provider: 'demo',
    },
    {
      name: 'Clash_enhanced_mode.yaml',
      template: 'clash',
      provider: 'demo',
      customParams: {
        enhancedMode: true,
      },
    },
  ],
  urlBase: 'https://config.example.com/',
  // https://surgio.js.org/guide/custom-config.html#upload
  // upload: { backend: 'oss', bucket: 'example-bucket', region: 'cn-hangzhou' },
}
