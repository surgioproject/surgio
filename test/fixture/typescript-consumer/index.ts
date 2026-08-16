import {
  categories,
  defineCustomProvider,
  defineSurgioConfig,
  utils,
  type SurgioConfig,
} from 'surgio'
import { NodeTypeEnum } from 'surgio/internal'
import {
  TtlCache,
  createCloudflareKvStore,
  type CloudflareKvNamespace,
  type KvStore,
} from 'surgio/cache'

const config: SurgioConfig = {
  artifacts: [],
  clashConfig: { clashCore: 'mihomo' },
}

defineSurgioConfig(config)
defineCustomProvider({
  nodeList: [
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'Mihomo node',
      hostname: 'example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
      clashConfig: { clashCore: 'mihomo' },
    },
  ],
})
utils.useKeywords(['Hong Kong'])

const category: string = categories.CLASH
const cacheType: typeof TtlCache = TtlCache
const storeFactory: (binding: CloudflareKvNamespace) => KvStore =
  createCloudflareKvStore

void category
void cacheType
void storeFactory
