import {
  categories,
  defineCustomProvider,
  defineSurgioConfig,
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
import { defineWorkerProject } from 'surgio/worker/config'

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
const workerProject = defineWorkerProject({
  config: { artifacts: [] },
  providers: {},
})
const runtimeFactory: typeof createSurgioRuntime = createSurgioRuntime
const manifestBuilder: typeof buildWorkerManifest = buildWorkerManifest
const manifest = null as WorkerManifest | null

void category
void cacheType
void storeFactory
void workerProject
void runtimeFactory
void manifestBuilder
void manifest
