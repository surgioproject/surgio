import { isError, isSurgioError, SurgioError } from '../utils/errors.js'

interface ProviderErrorContext {
  readonly providerName: string
  readonly providerPath?: string
}

// The caller names the configured provider entry. Its name and path replace
// any metadata set by nested providers.
export const withProviderError = async <T>(
  context: ProviderErrorContext,
  task: () => Promise<T>,
): Promise<T> => {
  try {
    return await task()
  } catch (error) {
    if (isSurgioError(error)) {
      error.providerName = context.providerName
      error.providerPath = context.providerPath
      throw error
    }
    throw new SurgioError(
      isError(error) ? error.message : '处理 Provider 失败',
      { cause: error, ...context },
    )
  }
}
