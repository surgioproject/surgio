import {
  categories,
  defineCustomProvider,
  httpClient,
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
  extendOutbounds,
  type ExtendContext,
  type ArtifactConfigInput,
  type GetNodeListParams,
  type JsonObject,
  type PossibleNodeConfigInputType,
  type ProjectProviderContext,
} from 'surgio/project'

import type { Logger } from '@surgio/logger'
import type { Artifact } from 'surgio/generator'

const renderWithCustomParams = (artifact: Artifact) => {
  const params = { count: 3, enabled: true, foo: { bar: ['node'] } }
  artifact.render(params)
  const context = artifact.getRenderContext(params)
  const names: string[] = context.customParams.foo.bar
  return names
}
const extendWithCustomParams = extendOutbounds(({ customParams }) => {
  const names: string[] = customParams.foo.bar
  return [{ type: 'selector', tag: 'Custom', outbounds: names }]
})
void renderWithCustomParams
void extendWithCustomParams

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

const customFilters = {
  hongKong: utils.mergeFilters([utils.useKeywords(['Hong Kong'])]),
  sorted: utils.useSortedKeywords(['Hong Kong', 'Japan']),
}
const extendWithCustomFilters = extendOutbounds(
  ({
    nodeList,
    customFilters,
    getSingboxNodeNames,
  }: ExtendContext): JsonObject[] => [
    {
      type: 'urltest',
      tag: 'Hong Kong',
      outbounds: [...getSingboxNodeNames(nodeList, customFilters.hongKong)],
    },
    {
      type: 'selector',
      tag: 'Sorted',
      outbounds: [...getSingboxNodeNames(nodeList, customFilters.sorted)],
    },
  ],
)
const contextFilters: ExtendContext['customFilters'] = customFilters
const invalidContextFilters: ExtendContext['customFilters'] = {
  // @ts-expect-error Custom filters must be node filters, not arbitrary values.
  invalid: 'filter',
}
void contextFilters
void invalidContextFilters
void extendWithCustomFilters

const category: string = categories.CLASH
const defaultHttpClient = httpClient
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
  customFilters,
  extendTemplate: extendWithCustomFilters,
} satisfies ArtifactConfigInput
const params = {} satisfies GetNodeListParams
const json = {} satisfies JsonObject
const nodes = [] satisfies PossibleNodeConfigInputType[]
const runtimeFactory: typeof createSurgioRuntime = createSurgioRuntime
const runtimeLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
} satisfies Logger
const manifestBuilder: typeof buildWorkerManifest = buildWorkerManifest
const manifest = null as WorkerManifest | null

void category
void defaultHttpClient
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
void runtimeLogger
void manifestBuilder
void manifest
