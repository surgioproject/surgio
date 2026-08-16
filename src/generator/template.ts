import path from 'node:path'
import fs from 'fs-extra'
import nunjucks from 'nunjucks'

import { addProxyToSurgeRuleSet } from '../utils/remote-snippet.js'

import { createTemplateFilters } from './template-filters.js'

import type { ClashCoreType, RemoteSnippet } from '../types.js'

export {
  convertNewSurgeScriptRuleToQuantumultXRewriteRule,
  convertSurgeScriptRuleToQuantumultXRewriteRule,
} from './template-filters.js'

export function getEngine(
  templateDir: string,
  options: { clashCore?: ClashCoreType } = {},
): nunjucks.Environment {
  const engine = nunjucks.configure(templateDir, { autoescape: false })
  for (const [name, filter] of Object.entries(createTemplateFilters(options))) {
    engine.addFilter(name, filter)
  }
  return engine
}

export const loadLocalSnippet = (
  cwd: string,
  relativeFilePath?: string,
): RemoteSnippet => {
  /* istanbul ignore next -- @preserve */
  if (!relativeFilePath) throw new Error('必须指定一个文件')
  const absFilePath = path.join(cwd, relativeFilePath)
  const file = fs.readFileSync(absFilePath, { encoding: 'utf-8' })
  return {
    url: absFilePath,
    name: '',
    main: (rule: string) => addProxyToSurgeRuleSet(file, rule),
    text: file,
  }
}
