import path from 'node:path'
import fs from 'fs-extra'
import nunjucks from 'nunjucks'

import { createRenderer } from '../runtime/renderer.js'
import { addProxyToSurgeRuleSet } from '../utils/remote-snippet.js'

import { createTemplateFilters } from './template-filters.js'

import type { Renderer } from '../runtime/renderer.js'
import type { ArtifactConfig, ClashCoreType, RemoteSnippet } from '../types.js'

export {
  convertNewSurgeScriptRuleToQuantumultXRewriteRule,
  convertSurgeScriptRuleToQuantumultXRewriteRule,
} from './template-filters.js'

export interface CreateNodeRendererOptions {
  readonly artifacts?: ReadonlyArray<ArtifactConfig>
  readonly clashCore?: ClashCoreType
}

export function createNodeRenderer(
  templateDir: string,
  options: CreateNodeRendererOptions = {},
): Renderer {
  const inlineTemplates = new Map<string, string>()
  for (const artifact of options.artifacts ?? []) {
    if (artifact.templateString) {
      inlineTemplates.set(
        `__artifacts__/${artifact.name}.tpl`,
        artifact.templateString,
      )
    }
  }
  const memoryLoader: nunjucks.ILoader = {
    getSource(name) {
      const source = inlineTemplates.get(name)
      return source === undefined
        ? null!
        : { src: source, path: name, noCache: true }
    },
  }
  const engine = new nunjucks.Environment(
    [memoryLoader, new nunjucks.FileSystemLoader(templateDir)],
    { autoescape: false },
  )
  for (const [name, filter] of Object.entries(createTemplateFilters(options))) {
    engine.addFilter(name, filter)
  }
  return createRenderer({
    renderTemplate: (name, context) => engine.render(name, context),
    loadJsonTemplate: (name) => fs.readJsonSync(path.join(templateDir, name)),
    resolveTemplateName(artifact) {
      if (!artifact.templateString) return `${artifact.template}.tpl`
      const name = `__artifacts__/${artifact.name}.tpl`
      inlineTemplates.set(name, artifact.templateString)
      return name
    },
  })
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
