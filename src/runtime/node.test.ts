import path from 'node:path'
import { describe, expect, test } from 'vitest'

import { loadSurgioProject } from '../project/node.js'

import { createNodeSurgioRuntime } from './node.js'

const fixture = path.resolve(import.meta.dirname, '../../test/fixture/plain')

describe('Node Surgio runtime', () => {
  test('renders through the shared runtime interface', async () => {
    const project = await loadSurgioProject(fixture)
    const runtime = createNodeSurgioRuntime(project)
    const artifact = runtime.listArtifacts()[0]
    const result = await runtime.renderArtifact(artifact.name)

    expect(result.artifact.name).toBe(artifact.name)
    expect(result.body.length).toBeGreaterThan(0)
    expect(runtime.listProviders().length).toBeGreaterThan(0)
    expect(runtime.getGatewayConfig()?.accessToken).toBe('abcd')
    await runtime.close()
  })
})
