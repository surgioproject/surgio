import { createTemplateFilters } from '../generator/template-filters.js'
import { createRenderer } from '../runtime/renderer.js'

import { PrecompiledTemplateEnvironment } from './precompiled-environment.js'

import type { Renderer } from '../runtime/renderer.js'
import type { ClashCoreType } from '../types.js'
import type { WorkerManifest } from './types.js'

export const createPrecompiledRenderer = (
  manifest: Pick<
    WorkerManifest,
    'artifactTemplates' | 'jsonTemplates' | 'templates'
  >,
  options: { readonly clashCore?: ClashCoreType } = {},
): Renderer => {
  const engine = new PrecompiledTemplateEnvironment(manifest.templates)
  for (const [name, filter] of Object.entries(createTemplateFilters(options))) {
    engine.addFilter(name, filter)
  }
  return createRenderer({
    renderTemplate: (name, context) => engine.render(name, context),
    loadJsonTemplate: (name) => manifest.jsonTemplates[name],
    resolveTemplateName(artifact) {
      if (!artifact.templateString) return `${artifact.template}.tpl`
      const name = manifest.artifactTemplates[artifact.name]
      if (!name) throw new Error(`Artifact ${artifact.name} 的内联模板尚未编译`)
      return name
    },
  })
}
