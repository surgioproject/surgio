import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, test } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '..')

type PackFile = {
  path: string
}

type PackResult = {
  files: PackFile[]
}

type PackageManifest = {
  dependencies?: Record<string, string>
  name: string
  type: string
  main: string
  types?: string
  peerDependencies?: Record<string, string>
  exports: {
    '.': {
      types?: string
      'module-sync': string
      default: string
    }
    './*': string
  }
}

const packages = [
  {
    directory: 'packages/gateway',
    required: ['dist/index.js', 'dist/index.d.ts'],
  },
  {
    directory: 'packages/gateway-frontend',
    required: ['index.js', 'index.d.ts', 'build/index.html'],
  },
  {
    directory: 'packages/logger',
    required: ['dist/index.js', 'dist/index.d.ts'],
  },
  {
    directory: 'packages/eslint-config-surgio',
    required: ['index.js'],
  },
] as const

const readManifest = (directory: string): PackageManifest => {
  const manifestPath = resolve(repositoryRoot, directory, 'package.json')

  return JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
}

const pack = (directory: string): string[] => {
  const output = execFileSync('pnpm', ['pack', '--dry-run', '--json'], {
    cwd: resolve(repositoryRoot, directory),
    encoding: 'utf8',
  })
  const parsed = JSON.parse(output) as PackResult | PackResult[]
  const result = Array.isArray(parsed) ? parsed[0] : parsed

  return result.files.map(({ path }) => path.replace(/^package\//, ''))
}

describe('published package output', () => {
  test('eslint config owns its TypeScript tooling', () => {
    const manifest = readManifest('packages/eslint-config-surgio')

    expect(manifest.dependencies).toMatchObject({
      typescript: '~6.0.3',
      'typescript-eslint': '^8.67.0',
    })
  })

  test('gateway requires Surgio v4', () => {
    const manifest = readManifest('packages/gateway')

    expect(manifest.peerDependencies?.surgio).toBe('^4.0.0')
  })

  test.each(packages)('$directory contains only publishable files', (item) => {
    const manifest = readManifest(item.directory)
    const files = pack(item.directory)
    const main = manifest.main.replace(/^\.\//, '')
    const mainExport = `./${main}`

    expect(manifest.type).toBe('module')
    expect(manifest.exports['.']['module-sync']).toBe(mainExport)
    expect(manifest.exports['.'].default).toBe(mainExport)
    if (manifest.name === '@surgio/gateway') {
      expect(manifest.exports['./node'].default).toBe('./dist/node.js')
      expect(manifest.exports['./lambda'].default).toBe('./dist/lambda.js')
      expect(manifest.exports['./worker'].default).toBe('./dist/worker.js')
    } else {
      expect(manifest.exports['./*']).toBe('./*')
    }
    expect(files).toContain('package.json')
    expect(files).toContain(main)
    item.required.forEach((file) => expect(files).toContain(file))

    if (manifest.types) {
      expect(files).toContain(manifest.types.replace(/^\.\//, ''))
      expect(manifest.exports['.'].types).toBe(
        `./${manifest.types.replace(/^\.\//, '')}`
      )
    }

    expect(files).not.toContain('.node-version')
    expect(files).not.toContain('tsconfig.json')
    expect(files).not.toContain('tsconfig.build.json')
    expect(files).not.toContain('vitest.config.ts')
    expect(files).not.toContain('vitest.e2e.config.ts')
    expect(files).not.toContain('vitest.config.mts')
    expect(files).not.toContain('vitest.e2e.config.mts')
    expect(files).not.toContain('vite.config.mts')
    expect(files).not.toContainEqual(expect.stringMatching(/(^|\/)src\//))
    expect(files).not.toContainEqual(
      expect.stringMatching(/(^|\/)(?:__tests__|coverage)\//)
    )
    expect(files).not.toContainEqual(
      expect.stringMatching(/\.(?:spec|test)\.[^.]+(?:\.map)?$/)
    )
    expect(files).not.toContainEqual(expect.stringMatching(/\.cjs$/))
  })

  test('ESM entrypoints load from their declared main files', async () => {
    const load = (directory: string) => {
      const manifest = readManifest(directory)
      const entrypoint = resolve(repositoryRoot, directory, manifest.main)

      return import(pathToFileURL(entrypoint).href)
    }

    const [gateway, gatewayNode, gatewayLambda, frontend, logger, eslintConfig] = await Promise.all([
      load('packages/gateway'),
      import(
        pathToFileURL(
          resolve(repositoryRoot, 'packages/gateway/dist/node.js')
        ).href
      ),
      import(
        pathToFileURL(
          resolve(repositoryRoot, 'packages/gateway/dist/lambda.js')
        ).href
      ),
      load('packages/gateway-frontend'),
      load('packages/logger'),
      load('packages/eslint-config-surgio'),
    ])

    expect(gateway.createGatewayApp).toBeTypeOf('function')
    expect(gatewayNode.createHttpServer).toBeTypeOf('function')
    expect(gatewayLambda.createLambdaHandler).toBeTypeOf('function')
    expect(frontend.default).toBeTypeOf('function')
    expect(logger.createLogger).toBeTypeOf('function')
    expect(logger.setLogLevel).toBeTypeOf('function')
    expect(logger).not.toHaveProperty('transports')
    expect(eslintConfig.default).toBeInstanceOf(Array)
  })

  test('module-sync entrypoints preserve CommonJS require shapes', () => {
    const load = (directory: string) => {
      const packageDirectory = resolve(repositoryRoot, directory)
      const manifest = readManifest(directory)
      const packageRequire = createRequire(
        resolve(packageDirectory, 'package.json')
      )

      return packageRequire(manifest.name)
    }

    const gateway = load('packages/gateway')
    const gatewayRequire = createRequire(
      resolve(repositoryRoot, 'packages/gateway/package.json')
    )
    const gatewayNode = gatewayRequire('@surgio/gateway/node')
    const gatewayLambda = gatewayRequire('@surgio/gateway/lambda')
    const frontend = load('packages/gateway-frontend')
    const logger = load('packages/logger')
    const eslintConfig = load('packages/eslint-config-surgio')

    expect(gateway.createGatewayApp).toBeTypeOf('function')
    expect(gatewayNode.createHttpServer).toBeTypeOf('function')
    expect(gatewayLambda.createLambdaHandler).toBeTypeOf('function')
    expect(frontend).toBeTypeOf('function')
    expect(frontend().name).toBe('@surgio/gateway-frontend')
    expect(logger.createLogger).toBeTypeOf('function')
    expect(logger.setLogLevel).toBeTypeOf('function')
    expect(logger).not.toHaveProperty('transports')
    expect(eslintConfig).toBeInstanceOf(Array)
  })

  test('frontend HTML references assets included in the package', () => {
    const frontendDirectory = resolve(
      repositoryRoot,
      'packages/gateway-frontend'
    )
    const html = readFileSync(resolve(frontendDirectory, 'build/index.html'), {
      encoding: 'utf8',
    })
    const document = new JSDOM(html).window.document
    const assetUrls = [
      ...Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[src]')
      ),
      ...Array.from(
        document.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"][href]'
        )
      ),
    ]
      .map(
        (element) => element.getAttribute('src') ?? element.getAttribute('href')
      )
      .filter((url): url is string => url?.startsWith('/') === true)
    const files = pack('packages/gateway-frontend')

    expect(assetUrls.length).toBeGreaterThan(0)
    assetUrls.forEach((url) => {
      const assetPath = url.replace(/^\//, '')

      expect(existsSync(resolve(frontendDirectory, 'build', assetPath))).toBe(
        true
      )
      expect(files).toContain(`build/${assetPath}`)
    })
  })
})
