import path from 'node:path'
import vm from 'node:vm'
import { build } from 'esbuild'
import { vi } from 'vitest'

it('bundles for Edge runtimes without Node compatibility', async () => {
  const result = await build({
    absWorkingDir: path.resolve(import.meta.dirname, '..'),
    bundle: true,
    conditions: ['browser', 'import', 'default'],
    entryPoints: ['src/index.ts'],
    format: 'esm',
    logLevel: 'silent',
    platform: 'browser',
    target: 'es2022',
    write: false,
  })

  expect(result.outputFiles).toHaveLength(1)
})

it('runs in an Edge-like global without process', async () => {
  const result = await build({
    absWorkingDir: path.resolve(import.meta.dirname, '..'),
    bundle: true,
    conditions: ['browser', 'import', 'default'],
    format: 'iife',
    globalName: 'loggerPackage',
    logLevel: 'silent',
    platform: 'browser',
    stdin: {
      contents: `
        import { createLogger } from './src/index.ts'
        createLogger({ service: 'edge' }).info('ready %s', 'now')
      `,
      loader: 'ts',
      resolveDir: path.resolve(import.meta.dirname, '..'),
    },
    target: 'es2022',
    write: false,
  })
  const info = vi.fn()

  vm.runInNewContext(result.outputFiles[0].text, {
    clearTimeout,
    console: {
      debug: vi.fn(),
      error: vi.fn(),
      info,
      log: vi.fn(),
      warn: vi.fn(),
    },
    setTimeout,
  })

  expect(info).toHaveBeenCalledWith(
    expect.stringMatching(/ \[edge\] info: ready %s$/),
    'now',
  )
})
