import 'mocha'
import { join } from 'path'
import { expect } from 'chai'
import execa from 'execa'
import fs from 'fs-extra'
import ini from 'ini'
import { runCommand } from '@oclif/test'

const fixture = join(process.cwd(), './test/fixture')
const resolve = (p: string) => join(fixture, p)
const binPath = join(process.cwd(), 'bin/run')

const runCommandWithEnv = async (
  args: string[],
  env: Record<string, string>,
) => {
  const originalEnv = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]]),
  )

  try {
    Object.assign(process.env, env)
    return await runCommand(args)
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
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

    expect(error).to.be.undefined
    expect(stdout).to.contain('surgio')
    expect(stdout).to.contain('node')
  })
})

describe('check command', () => {
  it('loads a CommonJS provider', async () => {
    const { error, stdout } = await runCommand([
      'check',
      'ss',
      `--project=${resolve('plain')}`,
    ])

    expect(error).to.be.undefined
    expect(stdout).to.contain('nodeName')
  })
})

describe('subscriptions command', () => {
  it('enumerates CommonJS providers', async () => {
    const { error, stdout } = await runCommand([
      'subscriptions',
      `--project=${resolve('subscriptions')}`,
    ])

    expect(error).to.be.undefined
    expect(stdout).to.contain('custom')
  })
})

describe('generate command', () => {
  describe('default', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('plain')}`,
      ])

      expect(error).to.be.undefined
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

      expect(fs.existsSync(resolve('plain/dist/new_path.conf'))).to.be.true
      expect(fs.existsSync(resolve('plain/dist/ss.conf'))).to.be.true
      expect(fs.existsSync(resolve('plain/dist/ssr.conf'))).to.be.true
      expect(fs.existsSync(resolve('plain/dist/v2rayn.conf'))).to.be.true
      expect(fs.existsSync(resolve('plain/dist/custom.conf'))).to.be.true
      expect(fs.existsSync(resolve('plain/dist/ssd.conf'))).to.be.true
      expect(fs.existsSync(resolve('plain/dist/singbox.json'))).to.be.true
      expect(confString1.split('\n')[0]).to.equal(
        '#!MANAGED-CONFIG https://example.com/ss_json.conf?access_token=abcd interval=43200 strict=false',
      )
      expect(confString2.includes('select, 🇺🇸 US')).to.be.true
      expect(Object.keys(conf.Proxy).length).to.be.equal(4)
      ;(expect(confString3).to as any).matchSnapshot()
      ;(expect(confString5).to as any).matchSnapshot()
      ;(expect(singboxConfString).to as any).matchSnapshot()
    })
  })

  describe('with --skip-fail', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('plain')}`,
        '--skip-fail',
      ])

      expect(error).to.be.undefined
      expect(fs.existsSync(resolve('plain/dist/new_path.conf'))).to.be.true
    })
  })

  describe('with template error', () => {
    it('fails to run generate cmd', async () => {
      const { error, stderr } = await runCommand([
        'generate',
        `--project=${resolve('template-error')}`,
      ])

      expect(error?.oclif?.exit).to.equal(1)
      expect(stderr).to.contain('expected comma after expression')
    })
  })

  describe('not specify binPath', () => {
    it('fails to run generate cmd', async () => {
      const { error, stderr } = await runCommand([
        'generate',
        `--project=${resolve('not-specify-binPath')}`,
      ])

      expect(error?.oclif?.exit).to.equal(1)
      expect(stderr).to.contain('添加 Shadowsocksr 二进制文件路径')
    })
  })

  describe('template variables and functions', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('template-variables-functions')}`,
      ])

      expect(error).to.be.undefined
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

      expect(confString).to.equal(result)
    })
  })

  describe('assign local port', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('assign-local-port')}`,
      ])

      expect(error).to.be.undefined
      const confString = fs.readFileSync(
        resolve('assign-local-port/dist/ssr.conf'),
        {
          encoding: 'utf8',
        },
      )
      const conf = ini.decode(confString)

      expect(conf.Proxy.测试中文.includes('local-port = 5000')).to.be.true
    })
  })

  describe('custom filter', () => {
    it('runs generate cmd', async () => {
      const { error } = await runCommand([
        'generate',
        `--project=${resolve('custom-filter')}`,
      ])

      expect(error).to.be.undefined
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

      ;(expect(confString1).to as any).matchSnapshot()
      ;(expect(confString2).to as any).matchSnapshot()
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

      expect(error).to.be.undefined
      const confString1 = fs.readFileSync(resolve('plain/dist/v2rayn.conf'), {
        encoding: 'utf8',
      })
      const confString2 = fs.readFileSync(
        resolve('plain/dist/clash_mod.conf'),
        {
          encoding: 'utf8',
        },
      )

      ;(expect(confString1).to as any).matchSnapshot()
      ;(expect(confString2).to as any).matchSnapshot()
    })
  })
})

describe('oclif integration', () => {
  it('lists business commands and help without plugin management', async () => {
    const { error, stdout } = await runCommand(['--help'])

    expect(error).to.be.undefined
    expect(stdout).to.contain('generate')
    expect(stdout).to.contain('help')
    expect(stdout).not.to.match(/^\s+plugins(?:\s|$)/m)
  })

  it('shows generate command help', async () => {
    const { error, stdout } = await runCommand(['help', 'generate'])

    expect(error).to.be.undefined
    expect(stdout).to.contain('生成规则')
    expect(stdout).to.contain('--project=<value>')
    expect(stdout).to.contain('--verbose')
    expect(stdout).to.contain('--skip-lint')
  })

  it('rejects the removed plugins command', async () => {
    const { error } = await runCommand(['plugins'])

    expect(error?.oclif?.exit).to.equal(2)
    expect(error?.message).to.equal('command plugins not found')
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

    expect(success.exitCode).to.equal(0)
    expect(success.stdout).to.contain('surgio')
    expect(failure.exitCode).to.equal(2)
    expect(failure.stderr).to.contain('command plugins not found')
    expect(failure.stderr).not.to.contain('ExitError')
    expect(failure.stderr).not.to.contain('node_modules/@oclif/core')

    await fs.remove(configHome)
  })
})
