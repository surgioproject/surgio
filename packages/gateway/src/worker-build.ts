import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface BuildGatewayWorkerOptions {
  readonly configFile?: string
  readonly manifestOutfile?: string
  readonly assetsOutdir?: string
}

export const buildGatewayWorker = async (options: BuildGatewayWorkerOptions = {}) => {
  const workerBuildEntry = 'surgio/worker/build'
  const { buildWorkerManifest } = await import(workerBuildEntry)
  const manifest = await buildWorkerManifest({
    ...(options.configFile ? { configFile: options.configFile } : {}),
    outfile: options.manifestOutfile ?? '.surgio/worker-manifest.mjs',
  })
  const frontendPackage = fileURLToPath(import.meta.resolve('@surgio/gateway-frontend/package.json'))
  const source = path.join(path.dirname(frontendPackage), 'build')
  const assetsOutdir = path.resolve(options.assetsOutdir ?? '.surgio/gateway-assets')
  await fs.rm(assetsOutdir, { recursive: true, force: true })
  await fs.cp(source, assetsOutdir, { recursive: true })
  return { manifest: manifest.outfile as string, assetsOutdir }
}
