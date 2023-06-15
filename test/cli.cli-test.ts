import 'mocha'
import { join } from 'path'
import fs from 'fs-extra'
import ini from 'ini'
import { test, expect } from '@oclif/test'

const fixture = join(__dirname, './fixture')
const resolve = (p: string) => join(fixture, p)

afterEach(async () => {
  process.env.ENV_SURGIO_PROJECT_DIR = undefined
  await fs.remove(resolve('plain/dist'))
  await fs.remove(resolve('template-error/dist'))
  await fs.remove(resolve('not-specify-binPath/dist'))
  await fs.remove(resolve('template-variables-functions/dist'))
  await fs.remove(resolve('assign-local-port/dist'))
  await fs.remove(resolve('custom-filter/dist'))
})

describe('doctor command', () => {
  test
    .stdout()
    .command(['doctor', `--project=${resolve('plain')}`])
    .it('runs doctor cmd', (ctx) => {
      expect(ctx.stdout).to.contain('surgio')
      expect(ctx.stdout).to.contain('node')
    })
})

describe('generate command', () => {
  describe('default', () => {
    test
      .stdout()
      .command(['generate', `--project=${resolve('plain')}`])
      .it('runs generate cmd', () => {
        const confString1 = fs.readFileSync(
          resolve('plain/dist/ss_json.conf'),
          {
            encoding: 'utf8',
          },
        )
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
        const conf = ini.decode(confString1)

        expect(fs.existsSync(resolve('plain/dist/new_path.conf'))).to.be.true
        expect(fs.existsSync(resolve('plain/dist/ss.conf'))).to.be.true
        expect(fs.existsSync(resolve('plain/dist/ssr.conf'))).to.be.true
        expect(fs.existsSync(resolve('plain/dist/v2rayn.conf'))).to.be.true
        expect(fs.existsSync(resolve('plain/dist/custom.conf'))).to.be.true
        expect(fs.existsSync(resolve('plain/dist/ssd.conf'))).to.be.true
        expect(confString1.split('\n')[0]).to.equal(
          '#!MANAGED-CONFIG https://example.com/ss_json.conf?access_token=abcd interval=43200 strict=false',
        )
        expect(confString2.includes('select, 🇺🇸 US')).to.be.true
        expect(Object.keys(conf.Proxy).length).to.be.equal(4)
        ;(expect(confString3).to as any).matchSnapshot()
        ;(expect(confString5).to as any).matchSnapshot()
      })
  })

  describe('with --skip-fail', () => {
    test
      .stdout()
      .command(['generate', `--project=${resolve('plain')}`, '--skip-fail'])
      .it('runs generate cmd', () => {
        expect(fs.existsSync(resolve('plain/dist/new_path.conf'))).to.be.true
      })
  })

  describe('with template error', () => {
    test
      .stdout({ print: false })
      .stderr({ print: false })
      .command(['generate', `--project=${resolve('template-error')}`])
      .exit(1)
      .it('fails to run generate cmd', (ctx) => {
        expect(ctx.stderr).to.contain('expected comma after expression')
      })
  })

  describe('not specify binPath', () => {
    test
      .stdout({ print: false })
      .stderr({ print: false })
      .command(['generate', `--project=${resolve('not-specify-binPath')}`])
      .exit(1)
      .it('fails to run generate cmd', (ctx) => {
        expect(ctx.stderr).to.contain('添加 Shadowsocksr 二进制文件路径')
      })
  })

  describe('template variables and functions', () => {
    test
      .stdout({ print: false })
      .stderr({ print: false })
      .command([
        'generate',
        `--project=${resolve('template-variables-functions')}`,
      ])
      .it('runs generate cmd', () => {
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
    test
      .stdout({ print: false })
      .stderr({ print: false })
      .command(['generate', `--project=${resolve('assign-local-port')}`])
      .it('runs generate cmd', () => {
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
    test
      .stdout({ print: false })
      .stderr({ print: false })
      .command(['generate', `--project=${resolve('custom-filter')}`])
      .it('runs generate cmd', () => {
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
    test
      .stdout({ print: false })
      .stderr({ print: false })
      .command(['generate', `--project=${resolve('plain')}`])
      .it('runs generate cmd', () => {
        process.env.TEST_TLS13_ENABLE = 'true'
        process.env.TEST_SKIP_CERT_VERIFY_ENABLE = 'true'

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

        process.env.TEST_TLS13_ENABLE = undefined
        process.env.TEST_SKIP_CERT_VERIFY_ENABLE = undefined
      })
  })
})
