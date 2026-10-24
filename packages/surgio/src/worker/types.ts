import type {
  ArtifactConfigInput,
  CommandConfigAfterNormalize,
} from '../types.js'
import type {
  ProjectProviderDefinition,
  SurgioProjectConfig,
  SurgioProjectDefinition,
} from '../project/types.js'
import type {
  ProviderFormat,
  RenderArtifactOptions,
  RenderProvidersOptions,
  RuntimeOptions,
  RuntimeRenderResult,
  SurgioRuntime,
} from '../runtime/public.js'

export type WorkerProviderDefinition = ProjectProviderDefinition
export type WorkerProjectDefinition = SurgioProjectDefinition

export interface WorkerRuntimeConfig extends CommandConfigAfterNormalize {
  readonly publicUrl: string
  readonly urlBase: string
}

export interface WorkerCompiledTemplate {
  readonly root: (...args: any[]) => void
  readonly [key: string]: unknown
}

export interface WorkerManifest {
  readonly surgioVersion: string
  readonly config: SurgioProjectConfig
  readonly providers: Readonly<Record<string, WorkerProviderDefinition>>
  readonly templates: Readonly<Record<string, WorkerCompiledTemplate>>
  readonly rawTemplates: Readonly<Record<string, string>>
  readonly jsonTemplates: Readonly<Record<string, unknown>>
  readonly artifactTemplates: Readonly<Record<string, string>>
}

export type WorkerRuntimeOptions = RuntimeOptions
export type WorkerProviderFormat = ProviderFormat
export type WorkerRenderResult = RuntimeRenderResult

export type { RenderArtifactOptions, RenderProvidersOptions, SurgioRuntime }

export type WorkerArtifactInput = ArtifactConfigInput
