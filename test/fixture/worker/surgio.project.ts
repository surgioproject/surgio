import {
  defineClashProvider,
  defineCustomProvider,
  defineSurgioProject,
} from '../../../build/project/index.js'

const demoProvider = defineClashProvider({
  url: 'https://provider.example/subscription',
})

const output: string = './dist'

export default defineSurgioProject({
  templateDir: './template',
  providers: {
    demo: demoProvider,
    surfboard: defineCustomProvider({
      nodeList: [
        {
          type: 'wireguard',
          nodeName: 'wg',
          privateKey: 'private=',
          selfIp: '10.0.0.2',
          selfIpV6: 'fd00::2',
          peers: [
            {
              publicKey: 'public=',
              endpoint: '[2001:db8::1]:51820',
              allowedIps: '0.0.0.0/0, ::/0',
              presharedKey: 'shared=',
              keepalive: 0,
            },
          ],
        },
        {
          type: 'anytls',
          nodeName: 'anytls',
          hostname: 'example.com',
          port: 443,
          password: 'secret',
          reuse: false,
          udpRelay: false,
        },
        {
          type: 'tuic',
          nodeName: 'tuic',
          hostname: 'example.com',
          port: 443,
          uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
          password: 'secret',
          version: 5,
          alpn: ['h3'],
          udpRelay: false,
        },
        {
          type: 'snell',
          nodeName: 'snell',
          hostname: 'example.com',
          port: 443,
          psk: 'secret',
          version: 4,
          obfs: 'http',
          obfsUri: '/obfs',
          udpRelay: true,
        },
        {
          type: 'hysteria2',
          nodeName: 'gecko-global',
          hostname: 'example.com',
          port: 443,
          password: 'secret',
        },
        {
          type: 'hysteria2',
          nodeName: 'gecko-node',
          hostname: 'example.com',
          port: 443,
          password: 'secret',
          surfboardConfig: { geckoPassword: 'node-gecko' },
        },
      ],
    }),
  },
  surfboardConfig: { geckoPassword: 'global-gecko' },
  remoteSnippets: [{ name: 'rules', url: 'https://rules.example/list' }],
  artifacts: [
    { name: 'demo.conf', provider: 'demo', template: 'demo' },
    { name: 'surfboard.conf', provider: 'surfboard', template: 'surfboard' },
  ],
})

export const nodeOptions = async () => ({
  output,
  cache: { type: 'filesystem' },
})
