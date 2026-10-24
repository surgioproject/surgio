import { createSurgioRuntime } from 'surgio/worker'

import { createGatewayApp } from './app.js'

import type { GatewayAssets, GatewayCache, GatewayRuntime } from './types.js'

export interface WorkerGatewayBindings {
  readonly cache: GatewayCache
  readonly assets?: GatewayAssets
}

export interface WorkerGatewayOptions<Env extends object> {
  readonly bindings: (env: Env) => WorkerGatewayBindings
  readonly errorCacheTtl?: number
  readonly createRuntime?: (
    manifest: unknown,
    options: Readonly<Record<string, unknown>>,
  ) => GatewayRuntime
}

export const createWorkerGateway = <Env extends object>(
  manifest: unknown,
  options: WorkerGatewayOptions<Env>,
) => {
  const states = new WeakMap<object, { runtime: GatewayRuntime; bindings: WorkerGatewayBindings }>()
  const stateFor = (env: Env) => {
    const existing = states.get(env)
    if (existing) return existing
    const bindings = options.bindings(env)
    const runtime = (options.createRuntime ?? createSurgioRuntime)(manifest, {
      cache: bindings.cache,
    }) as GatewayRuntime
    const state = { runtime, bindings }
    states.set(env, state)
    return state
  }
  const app = createGatewayApp<Env>({
    runtime: (context) => stateFor(context.env).runtime,
    cache: (context) => stateFor(context.env).bindings.cache,
    assets: (context) => stateFor(context.env).bindings.assets,
    errorCacheTtl: options.errorCacheTtl,
  })
  return { fetch: app.fetch }
}
