import type { Logger } from '@surgio/logger'
import type { TtlCache } from '../cache/core.js'
import type {
  CommandConfigBeforeNormalize,
  PossibleProviderConfigType,
} from '../types.js'
import type { RuntimeHttpClient } from '../runtime/types.js'

export interface ProjectProviderContext {
  readonly cache: Pick<TtlCache, 'get' | 'set' | 'wrap'>
  readonly httpClient: RuntimeHttpClient
  readonly logger: Logger
}

export type ProjectProviderDefinition =
  | PossibleProviderConfigType
  | ((
      context: ProjectProviderContext,
    ) => PossibleProviderConfigType | PromiseLike<PossibleProviderConfigType>)

export type SurgioProjectConfig = Omit<
  CommandConfigBeforeNormalize,
  'cache' | 'upload'
>

export type SurgioProjectDefinition = SurgioProjectConfig & {
  readonly providers: Readonly<Record<string, ProjectProviderDefinition>>
  readonly templateDir?: string
}

export type SurgioNodeOptions = Pick<
  CommandConfigBeforeNormalize,
  'cache' | 'upload'
> & {
  readonly output?: string
}

export interface SurgioProjectModule {
  readonly default: SurgioProjectDefinition
  readonly nodeOptions?: () => SurgioNodeOptions | Promise<SurgioNodeOptions>
}
