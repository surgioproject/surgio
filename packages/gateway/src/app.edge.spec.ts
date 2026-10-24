import path from 'node:path'
import { build } from 'esbuild'

it('bundles the Gateway app for Edge runtimes without Node compatibility', async () => {
  const result = await build({
    absWorkingDir: path.resolve(import.meta.dirname, '..'),
    bundle: true,
    conditions: ['browser', 'import', 'default'],
    entryPoints: ['src/app.ts'],
    format: 'esm',
    logLevel: 'silent',
    platform: 'browser',
    target: 'es2022',
    write: false,
  })

  expect(result.outputFiles).toHaveLength(1)
})
