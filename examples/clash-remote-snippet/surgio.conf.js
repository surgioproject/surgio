'use strict';

module.exports = {
  remoteSnippets: [
    {
      name: 'youtube',
      url: 'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Media/YouTube.list',
    },
    {
      name: 'global',
      url: 'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Global.list',
    },
    {
      name: 'netflix',
      url: 'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Media/Netflix.list',
    },
  ],
  artifacts: [
    {
      name: 'Clash.conf',
      template: 'clash',
      provider: 'demo',
      proxyGroupModifier: proxyGroupModifier,
    },
    {
      name: 'Clash_enhanced_mode.conf',
      template: 'clash',
      provider: 'demo',
      proxyGroupModifier: proxyGroupModifier,
      customParams: {
        enhancedMode: true,
      },
    },
  ],
  urlBase: 'https://config.example.com/',
  // https://surgio.royli.dev/guide/custom-config.html#upload
  // upload: {},
};

function proxyGroupModifier(nodeList, filters) {
  return [
    {
      name: '🚀 Proxy',
      type: 'select',
    },
    {
      name: '🎬 Netflix',
      filter: filters.netflixFilter,
      type: 'select',
    },
    {
      name: '📺 Youtube',
      filter: filters.youtubePremiumFilter,
      proxies: ['🚀 Proxy'],
      type: 'select',
    },
    {
      name: 'US',
      filter: filters.usFilter,
      type: 'url-test',
    },
    {
      name: 'HK',
      filter: filters.hkFilter,
      type: 'url-test',
    },
    {
      name: '🍎 Apple',
      proxies: ['DIRECT', '🚀 Proxy', 'US', 'HK'],
      type: 'select',
    },
    {
      name: '🍎 Apple CDN',
      proxies: ['DIRECT', '🍎 Apple'],
      type: 'select',
    },
  ];
}
