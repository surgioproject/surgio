import { join } from 'path'
import { expect, test } from 'vitest'
import nock from 'nock'

import { loadConfig } from '../../config.js'
import { NodeTypeEnum } from '../../types.js'
import { Artifact } from '../artifact.js'
import { getEngine } from '../template.js'

const resolve = (p: string) => join(__dirname, '../../../test/fixture/', p)

test('new Artifact()', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  })
  const templateEngine = getEngine(config.templateDir)

  expect(artifact.isReady).toBe(false)
  await artifact.init()
  expect(artifact.isReady).toBe(true)

  expect(() => {
    artifact.render(templateEngine)
  }).not.toThrow()

  await expect(async () => {
    await artifact.init()
  }).rejects.toThrow()
})

test('Artifact without templateEngine', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  })
  const templateEngine = getEngine(config.templateDir)

  expect(() => {
    artifact.render()
  }).toThrow()

  await artifact.init()

  expect(() => {
    artifact.render()
  }).toThrow()
  expect(() => {
    artifact.render(templateEngine)
  }).not.toThrow()
  const instance = await new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'test',
      provider: 'ss_json',
    },
    { templateEngine },
  ).init()
  instance.render()
})

test('render with extendRenderContext', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const templateEngine = getEngine(config.templateDir)

  {
    const artifact = new Artifact(
      config,
      {
        name: 'new_path.conf',
        template: 'extend-render-context',
        provider: 'ss_json',
      },
      { templateEngine },
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
      { templateEngine },
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
      { templateEngine },
    )
    await artifact.init()

    expect(
      artifact.render(undefined, {
        foo: 'foo',
      }),
    ).toMatchSnapshot()
  }
})

test('getRenderContext', async () => {
  const fixture = resolve('plain')
  const config = loadConfig(fixture)
  const templateEngine = getEngine(config.templateDir)
  const artifact = new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'extend-render-context',
      provider: 'ss_json',
    },
    { templateEngine },
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
  const templateEngine = getEngine(config.templateDir)

  const artifact = new Artifact(
    config,
    {
      name: 'new_path.conf',
      template: 'test',
      provider: 'ss_with_up',
    },
    { templateEngine },
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
