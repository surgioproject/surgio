'use strict'

import { Environment } from 'nunjucks'

import { Artifact } from './generator/artifact'
import { ArtifactConfig, CommandConfig, RemoteSnippet } from './types'

export async function generate(
  config: CommandConfig,
  artifact: ArtifactConfig,
  remoteSnippetList: ReadonlyArray<RemoteSnippet>,
  templateEngine: Environment,
): Promise<string> {
  const artifactInstance = new Artifact(config, artifact, {
    remoteSnippetList,
  })

  await artifactInstance.init()

  return artifactInstance.render(templateEngine)
}
