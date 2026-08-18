import {
  categories,
  defineCustomProvider,
  utils,
  type SurgioConfig,
} from 'surgio'
import { NodeTypeEnum } from 'surgio/internal'
import { TtlCache, type KvStore } from 'surgio/cache/core'
import {
  createCloudflareKvStore,
  type CloudflareKvNamespace,
} from 'surgio/cache/cloudflare'
import { createSurgioRuntime, type WorkerManifest } from 'surgio/worker'
import { buildWorkerManifest } from 'surgio/worker/build'
import {
  defineSurgioProject,
  env,
  type ArtifactConfigInput,
  type GetNodeListParams,
  type JsonObject,
  type PossibleNodeConfigInputType,
  type ProjectProviderContext,
} from 'surgio/project'

const config: SurgioConfig = {
  artifacts: [],
  clashConfig: { clashCore: 'mihomo' },
}

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
const workerProject = defineSurgioProject({
  artifacts: [],
  providers: {},
})
const environmentReader: (key: string) => string = env
const projectProvider = (context: ProjectProviderContext) => {
  void context.cache
  return defineCustomProvider({ nodeList: [] })
}
const artifact = {
  name: 'demo.conf',
  provider: 'demo',
  template: 'demo',
} satisfies ArtifactConfigInput
const params = {} satisfies GetNodeListParams
const json = {} satisfies JsonObject
const nodes = [] satisfies PossibleNodeConfigInputType[]
const runtimeFactory: typeof createSurgioRuntime = createSurgioRuntime
const manifestBuilder: typeof buildWorkerManifest = buildWorkerManifest
const manifest = null as WorkerManifest | null

void category
void config
void cacheType
void storeFactory
void workerProject
void environmentReader
void projectProvider
void artifact
void params
void json
void nodes
void runtimeFactory
void manifestBuilder
void manifest
