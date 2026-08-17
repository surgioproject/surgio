import type { ArtifactConfig } from '../types.js'

export type RenderContext = Readonly<Record<string, unknown>>

export interface Renderer {
  renderArtifact(artifact: ArtifactConfig, context: RenderContext): string
  renderTemplate(name: string, context?: RenderContext): string
}

interface RendererSource {
  readonly renderTemplate: (name: string, context: RenderContext) => string
  readonly loadJsonTemplate: (name: string) => unknown
  readonly resolveTemplateName?: (artifact: ArtifactConfig) => string
}

const defaultTemplateName = (artifact: ArtifactConfig): string => {
  if (artifact.templateString) {
    throw new Error(`Artifact ${artifact.name} 的内联模板尚未注册`)
  }
  return `${artifact.template}.tpl`
}

export const createRenderer = (source: RendererSource): Renderer => ({
  renderArtifact(artifact, context) {
    if (artifact.templateType !== 'json') {
      const name = source.resolveTemplateName
        ? source.resolveTemplateName(artifact)
        : defaultTemplateName(artifact)
      return source.renderTemplate(name, context)
    }

    if (!artifact.extendTemplate) {
      throw new Error('JSON 模板需要提供 extendTemplate 函数')
    }

    const name = `${artifact.template}.json`
    try {
      const template = source.loadJsonTemplate(name)
      if (template === undefined) {
        throw new Error(`JSON 模板 ${name} 不存在`)
      }
      const input = JSON.parse(JSON.stringify(template))
      return JSON.stringify(artifact.extendTemplate(input, context), null, 2)
    } catch (error) {
      const message = error instanceof Error ? `: ${error.message}` : ''
      throw new Error(`Error when rendering JSON template ${name}${message}`, {
        cause: error,
      })
    }
  },

  renderTemplate(name, context = {}) {
    return source.renderTemplate(name, context)
  },
})
