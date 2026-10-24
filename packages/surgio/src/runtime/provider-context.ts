import type { ProviderRuntimeContext } from './types.js'

let defaultContext: ProviderRuntimeContext | undefined

export const setDefaultProviderRuntimeContext = (
  context: ProviderRuntimeContext,
): void => {
  defaultContext = context
}

export const getDefaultProviderRuntimeContext = (): ProviderRuntimeContext => {
  if (!defaultContext) {
    throw new Error(
      'Provider runtime is not configured; use createSurgioRuntime or import providers through surgio/provider',
    )
  }

  return defaultContext
}
