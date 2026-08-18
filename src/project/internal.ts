import type {
  ProjectProviderDefinition,
  SurgioProjectConfig,
  SurgioProjectDefinition,
} from './types.js'

interface SurgioProjectProjection {
  readonly config: SurgioProjectConfig
  readonly providers: Readonly<Record<string, ProjectProviderDefinition>>
  readonly templateDir?: string
}

export const projectToRuntimeProjection = (
  project: SurgioProjectDefinition,
): SurgioProjectProjection => {
  const { providers, templateDir, ...config } = project

  return {
    config,
    providers,
    ...(templateDir === undefined ? {} : { templateDir }),
  }
}
