import { join } from 'path'
import { execa } from 'execa'
import fs from 'fs-extra'
import ini from 'ini'
import { runCommand } from '@oclif/test'
import { afterEach, describe, expect, it, vi } from 'vitest'

const fixture = join(process.cwd(), './test/fixture')
const resolve = (p: string) => join(fixture, p)
const binPath = join(process.cwd(), 'bin/run')

const runCommandWithEnv = async (
  args: string[],
  env: Record<string, string>,
) => {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value)
  }

  try {
    return await runCommand(args)
  } finally {
    vi.unstubAllEnvs()
  }
}

afterEach(async () => {
  delete process.env.ENV_SURGIO_PROJECT_DIR
  await fs.remove(resolve('plain/dist'))
  await fs.remove(resolve('template-error/dist'))
  await fs.remove(resolve('not-specify-binPath/dist'))
  await fs.remove(resolve('template-variables-functions/dist'))
  await fs.remove(resolve('assign-local-port/dist'))
  await fs.remove(resolve('custom-filter/dist'))
})

describe('doctor command', () => {
  it('runs doctor cmd', async () => {
    const { error, stdout } = await runCommand([
      'doctor',
      `--project=${resolve('plain')}`,
    ])

    expect(error).toBeUndefined()
    expect(stdout).toContain('surgio')
    expect(stdout).toContain('node')
  })
})

describe('check command', () => {
  it('loads a CommonJS provider', async () => {
    const { error, stdout } = await runCommand([
      'check',
      'ss',
      `--project=${resolve('plain')}`,
    ])

    expect(error).toBeUndefined()
    expect(stdout).toContain('nodeName')
  })
})

describe('subscriptions command', () => {
  it('enumerates CommonJS providers', async () => {
    const { error, stdout } = await runCommand([
      'subscriptions',
      `--project=${resolve('subscriptions')}`,
    ])

    expect(error).toBeUndefined()
    expect(stdout).toContain('custom')
  })
})

describe('generate command', () => {
  describe('default', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('plain')}`,
      ])

      expect(error).toBeUndefined()
      const confString1 = fs.readFileSync(resolve('plain/dist/ss_json.conf'), {
        encoding: 'utf8',
      })
      const confString2 = fs.readFileSync(resolve('plain/dist/custom.conf'), {
        encoding: 'utf8',
      })
      const confString3 = fs.readFileSync(
        resolve('plain/dist/template-functions.conf'),
        {
          encoding: 'utf8',
        },
      )
      const confString5 = fs.readFileSync(resolve('plain/dist/v2rayn.conf'), {
        encoding: 'utf8',
      })
      const singboxConfString = fs.readFileSync(
        resolve('plain/dist/singbox.json'),
        {
          encoding: 'utf8',
        },
      )
      const conf = ini.decode(confString1)

      expect(fs.existsSync(resolve('plain/dist/new_path.conf'))).toBe(true)
      expect(fs.existsSync(resolve('plain/dist/ss.conf'))).toBe(true)
      expect(fs.existsSync(resolve('plain/dist/ssr.conf'))).toBe(true)
      expect(fs.existsSync(resolve('plain/dist/v2rayn.conf'))).toBe(true)
      expect(fs.existsSync(resolve('plain/dist/custom.conf'))).toBe(true)
      expect(fs.existsSync(resolve('plain/dist/ssd.conf'))).toBe(true)
      expect(fs.existsSync(resolve('plain/dist/singbox.json'))).toBe(true)
      expect(confString1.split('\n')[0]).toBe(
        '#!MANAGED-CONFIG https://example.com/ss_json.conf?access_token=abcd interval=43200 strict=false',
      )
      expect(confString2.includes('select, 🇺🇸 US')).toBe(true)
      expect(Object.keys(conf.Proxy).length).toBe(4)
      expect(confString3).toMatchSnapshot()
      expect(confString5).toMatchSnapshot()
      expect(singboxConfString).toMatchSnapshot()
    })
  })

  describe('with --skip-fail', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('plain')}`,
        '--skip-fail',
      ])

      expect(error).toBeUndefined()
      expect(fs.existsSync(resolve('plain/dist/new_path.conf'))).toBe(true)
    })
  })

  describe('with template error', () => {
    it('fails to run generate cmd', async () => {
      const { error, stderr } = await runCommand([
        'generate',
        `--project=${resolve('template-error')}`,
      ])

      expect(error?.oclif?.exit).toBe(1)
      expect(stderr).toContain('expected comma after expression')
    })
  })

  describe('not specify binPath', () => {
    it('fails to run generate cmd', async () => {
      const { error, stderr } = await runCommand([
        'generate',
        `--project=${resolve('not-specify-binPath')}`,
      ])

      expect(error?.oclif?.exit).toBe(1)
      expect(stderr).toContain('添加 Shadowsocksr 二进制文件路径')
    })
  })

  describe('template variables and functions', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('template-variables-functions')}`,
      ])

      expect(error).toBeUndefined()
      const confString = fs.readFileSync(
        resolve('template-variables-functions/dist/ss.conf'),
        {
          encoding: 'utf8',
        },
      )
      const result =
        '# Netflix\n' +
        'USER-AGENT,Argo*,Proxy\n' +
        'DOMAIN-SUFFIX,fast.com,Proxy\n' +
        'DOMAIN-SUFFIX,netflix.com,Proxy\n' +
        'DOMAIN-SUFFIX,netflix.net,Proxy\n' +
        'DOMAIN-SUFFIX,nflxext.com,Proxy\n' +
        'DOMAIN-SUFFIX,nflximg.com,Proxy\n' +
        'DOMAIN-SUFFIX,nflximg.net,Proxy\n' +
        'DOMAIN-SUFFIX,nflxso.net,Proxy\n' +
        'DOMAIN-SUFFIX,nflxvideo.net,Proxy\n' +
        'http://example.com/ss.conf\n'

      expect(confString).toBe(result)
    })
  })

  describe('assign local port', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('assign-local-port')}`,
      ])

      expect(error).toBeUndefined()
      const confString = fs.readFileSync(
        resolve('assign-local-port/dist/ssr.conf'),
        {
          encoding: 'utf8',
        },
      )
      const conf = ini.decode(confString)

      expect(conf.Proxy.测试中文.includes('local-port = 5000')).toBe(true)
    })
  })

  describe('custom filter', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('custom-filter')}`,
      ])

      expect(error).toBeUndefined()
      const confString1 = fs.readFileSync(
        resolve('custom-filter/dist/ss.conf'),
        {
          encoding: 'utf8',
        },
      )
      const confString2 = fs.readFileSync(
        resolve('custom-filter/dist/test_sorted_filter.conf'),
        {
          encoding: 'utf8',
        },
      )

      expect(confString1).toMatchSnapshot()
      expect(confString2).toMatchSnapshot()
    })
  })

  describe('v2ray tls options', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommandWithEnv(
        ['generate', `--project=${resolve('plain')}`],
        {
          TEST_TLS13_ENABLE: 'true',
          TEST_SKIP_CERT_VERIFY_ENABLE: 'true',
        },
      )

      expect(error).toBeUndefined()
      const confString1 = fs.readFileSync(resolve('plain/dist/v2rayn.conf'), {
        encoding: 'utf8',
      })
      const confString2 = fs.readFileSync(
        resolve('plain/dist/clash_mod.conf'),
        {
          encoding: 'utf8',
        },
      )

      expect(confString1).toMatchSnapshot()
      expect(confString2).toMatchSnapshot()
    })
  })
})

describe('oclif integration', () => {
  it('lists business commands and help without plugin management', async () => {
    const { error, stdout } = await runCommand(['--help'])

    expect(error).toBeUndefined()
    expect(stdout).toContain('generate')
    expect(stdout).toContain('help')
    expect(stdout).not.toMatch(/^\s+plugins(?:\s|$)/m)
  })

  it('shows generate command help', async () => {
    const { error, stdout } = await runCommand(['help', 'generate'])

    expect(error).toBeUndefined()
    expect(stdout).toContain('生成规则')
    expect(stdout).toContain('--project=<value>')
    expect(stdout).toContain('--verbose')
    expect(stdout).toContain('--skip-lint')
  })

  it('rejects the removed plugins command', async () => {
    const { error } = await runCommand(['plugins'])

    expect(error?.oclif?.exit).toBe(2)
    expect(error?.message).toBe('command plugins not found')
  })

  it('runs the production entrypoint without leaking error stacks', async () => {
    const configHome = resolve('cli-config')
    const env = { ...process.env, XDG_CONFIG_HOME: configHome }
    const success = await execa(
      process.execPath,
      [binPath, 'doctor', `--project=${resolve('plain')}`],
      { env, reject: false },
    )
    const failure = await execa(process.execPath, [binPath, 'plugins'], {
      env,
      reject: false,
    })

    expect(success.exitCode).toBe(0)
    expect(success.stdout).toContain('surgio')
    expect(failure.exitCode).toBe(2)
    expect(failure.stderr).toContain('command plugins not found')
    expect(failure.stderr).not.toContain('ExitError')
    expect(failure.stderr).not.toContain('node_modules/@oclif/core')

    await fs.remove(configHome)
  })
})
