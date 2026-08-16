import { createTemplateFilters } from '../generator/template-filters.js'

import { WorkerTemplateEnvironment } from './precompiled-environment.js'

import type { ClashCoreType } from '../types.js'
import type { WorkerCompiledTemplate } from './types.js'

export const createWorkerTemplateEngine = (
  templates: Readonly<Record<string, WorkerCompiledTemplate>>,
  options: { readonly clashCore?: ClashCoreType } = {},
): WorkerTemplateEnvironment => {
  const engine = new WorkerTemplateEnvironment(templates)
  for (const [name, filter] of Object.entries(createTemplateFilters(options))) {
    engine.addFilter(name, filter)
  }
  return engine
}
