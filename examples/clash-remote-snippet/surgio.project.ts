import { defineSurgioProject } from 'surgio/project'

import demo from './provider/demo.ts'

import type { ArtifactConfigInput } from 'surgio/project'

const artifacts = [
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
] satisfies ArtifactConfigInput[]

export default defineSurgioProject({
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
  artifacts,
  urlBase: 'https://config.example.com/',
  providers: { demo },
  templateDir: './template',
})
