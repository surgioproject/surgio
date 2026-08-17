import { join } from 'path'
import { expect, test } from 'vitest'
import nock from 'nock'

import { loadConfig, normalizeConfig } from '../../config.js'
import { NodeTypeEnum } from '../../types.js'
import { Artifact } from '../artifact.js'
import { createNodeRenderer } from '../template.js'

const resolve = (p: string) => join(__dirname, '../../../test/fixture/', p)

test('defaults to Mihomo while preserving explicit Clash cores', () => {
  const fixture = resolve('plain')

  expect(loadConfig(fixture).clashConfig?.clashCore).toBe('clash.meta')
  expect(
    normalizeConfig(fixture, {
      artifacts: [],
      clashConfig: { clashCore: 'clash' },
    }).clashConfig?.clashCore,
  ).toBe('clash')
  expect(
    normalizeConfig(fixture, {
      artifacts: [],
      clashConfig: { clashCore: 'stash' },
    }).clashConfig?.clashCore,
  ).toBe('stash')
})

test('new Artifact()', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const artifact = new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'test',
      provider: 'ss_json',
    },
    { renderer: createNodeRenderer(config.templateDir) },
  )

  expect(artifact.isReady).toBe(false)
  await artifact.init()
  expect(artifact.isReady).toBe(true)

  expect(() => {
    artifact.render()
  }).not.toThrow()

  await expect(async () => {
    await artifact.init()
  }).rejects.toThrow()
})

test('Artifact without renderer', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  })
  const renderer = createNodeRenderer(config.templateDir)

  expect(() => {
    artifact.render()
  }).toThrow()

  await artifact.init()

  expect(() => {
    artifact.render()
  }).toThrow()
  const instance = await new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'test',
      provider: 'ss_json',
    },
    { renderer },
  ).init()
  instance.render()
})

test('render with extendRenderContext', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const renderer = createNodeRenderer(config.templateDir)

  {
    const artifact = new Artifact(
      config,
      {
        name: 'new_path.conf',
        template: 'extend-render-context',
        provider: 'ss_json',
      },
      { renderer },
    )
    await artifact.init()

    expect(artifact.render()).toMatchSnapshot()
  }

  {
    const artifact = new Artifact(
      config,
      {
        name: 'new_path.conf',
        template: 'extend-render-context',
        provider: 'ss_json',
        customParams: {
          foo: 'bar',
        },
      },
      { renderer },
    )
    await artifact.init()

    expect(artifact.render()).toMatchSnapshot()
  }

  {
    const artifact = new Artifact(
      config,
      {
        name: 'new_path.conf',
        template: 'extend-render-context',
        provider: 'ss_json',
        customParams: {
          foo: 'bar',
        },
      },
      { renderer },
    )
    await artifact.init()

    expect(
      artifact.render({
        foo: 'foo',
      }),
    ).toMatchSnapshot()
  }
})

test('getRenderContext', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const renderer = createNodeRenderer(config.templateDir)
  const artifact = new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'extend-render-context',
      provider: 'ss_json',
    },
    { renderer },
  )

  await artifact.init()

  const ctx = artifact.getRenderContext()

  expect(ctx.downloadUrl).toBe(
    'https://example.com/new_path.conf?access_token=abcd',
  )
  expect(ctx.getUrl('/extend-provider?format=foo')).toBe(
    'https://example.com/extend-provider?format=foo&access_token=abcd',
  )
  expect(ctx.getUrl('get-artifact/test.conf?format=foo')).toBe(
    'https://example.com/get-artifact/test.conf?format=foo&access_token=abcd',
  )
  expect(ctx.getDownloadUrl('test.conf?format=foo')).toBe(
    'https://example.com/test.conf?format=foo&access_token=abcd',
  )
  expect(ctx.customParams).toEqual({
    globalVariable: 'foo',
    globalVariableWillBeRewritten: 'bar',
    subLevel: {
      anotherVariableWillBeRewritten: 'value',
    },
  })
  expect(typeof ctx.getSurgeTailscaleNodes).toBe('function')
  expect(
    ctx.getSurgeTailscaleNodes([
      {
        type: NodeTypeEnum.Tailscale,
        nodeName: 'tailnet',
        authKey: 'tskey-auth-example',
      },
    ]),
  ).toBe('[Tailscale tailnet]\nauth-key=tskey-auth-example')
})

test('Artifact with underlyingProxy', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const renderer = createNodeRenderer(config.templateDir)

  const artifact = new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'test',
      provider: 'ss_with_up',
    },
    { renderer },
  )
  await artifact.init()

  expect(artifact.render()).toMatchSnapshot()
})

test('Artifact rejects provider underlyingProxy with MASQUE portHopping', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const providerName = 'clash_masque_with_up'

  nock('http://artifact-test')
    .get('/masque.yaml')
    .reply(
      200,
      `
proxies: []
`,
    )

  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: providerName,
  })

  await expect(artifact.init()).rejects.toThrow('节点配置校验失败')
})
