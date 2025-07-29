import crypto from 'crypto'
import path from 'path'
import { Flags } from '@oclif/core'
import fs from 'fs-extra'

import {
  PossibleNodeConfigType,
  ArtifactConfig,
  PossibleProviderConfigType,
} from '../types'
import BaseCommand from '../base-command'
import { Artifact, getEngine } from '../generator'
import { getProvider } from '../provider'
import { setConfig } from '../config'
import { checkAndFix } from '../utils/linter'
import { loadRemoteSnippetList } from '../utils'

class GenerateCommand extends BaseCommand<typeof GenerateCommand> {
  static description = '生成规则'

  public async run(): Promise<void> {
    if (this.flags.local) {
      await this.generateLocal()
      return
    }

    if (!this.flags['skip-lint']) {
      const result = await checkAndFix(this.projectDir)

      if (!result) {
        throw new Error(
          'JS 语法检查不通过，请根据提示修改文件（参考 https://url.royli.dev/SeB6m）',
        )
      }
    }

    if (this.flags.output) {
      setConfig('output', this.flags.output)
    }

    await this.generate(this.flags['skip-fail'], this.flags['cache-snippet'])

    await this.cleanup()
  }

  private async generate(
    skipFail?: boolean,
    cacheSnippet?: boolean,
  ): Promise<void> {
    this.ora.info('开始生成规则')

    const config = this.surgioConfig
    const artifactList: ReadonlyArray<ArtifactConfig> = config.artifacts
    const distPath = config.output
    const remoteSnippetsConfig = config.remoteSnippets || []
    const remoteSnippetList = await loadRemoteSnippetList(
      remoteSnippetsConfig,
      cacheSnippet,
    )
    const templateEngine = getEngine(config.templateDir, {
      clashCore: config.clashConfig?.clashCore,
    })

    await fs.mkdirp(distPath)

    for (const artifact of artifactList) {
      this.ora.start(`正在生成规则 ${artifact.name}`)

      try {
        const artifactInstance = new Artifact(config, artifact, {
          remoteSnippetList,
        })

        artifactInstance.once('initProvider:end', () => {
          this.ora.text = `已处理 Provider ${artifactInstance.initProgress}/${artifactInstance.providerNameList.length}...`
        })

        await artifactInstance.init()

        const result = artifactInstance.render(templateEngine)
        const destFilePath = path.join(config.output, artifact.name)

        if (artifact.destDir) {
          fs.accessSync(artifact.destDir, fs.constants.W_OK)
          await fs.writeFile(path.join(artifact.destDir, artifact.name), result)
        } else {
          await fs.writeFile(destFilePath, result)
        }

        this.ora.succeed(`规则 ${artifact.name} 生成成功`)
      } catch (err) {
        this.ora.fail(`规则 ${artifact.name} 生成失败`)

        // istanbul ignore next
        if (skipFail && err instanceof Error) {
          console.error(err.stack || err)
        } else {
          throw err
        }
      }
    }

    this.ora.succeed('规则生成成功')
  }

  private async generateLocal(): Promise<void> {
    this.ora.info('开始拉取阅后即焚 Provider')

    const config = this.surgioConfig
    const localDir = path.join(this.projectDir, 'local')
    const providerFiles = await fs.readdir(config.providerDir)
    const jsProviderFiles = providerFiles.filter((file) => file.endsWith('.js'))
    const providers: {
      name: string
      config: PossibleProviderConfigType
    }[] = jsProviderFiles.map((file) => {
      const filePath = path.join(config.providerDir, file)
      return {
        name: path.basename(file, '.js'),
        config: require(filePath),
      }
    })

    const ephemeralProviders = providers.filter((p) => p.config.fetchOnce)

    if (!ephemeralProviders.length) {
      this.ora.warn('没有找到 fetchOnce Provider')
      return
    }

    await fs.mkdirp(localDir)

    for (const providerMeta of ephemeralProviders) {
      const providerName = providerMeta.name
      this.ora.start(`正在处理 Provider ${providerName}`)

      try {
        const provider = await getProvider(providerName, providerMeta.config)
        const nodeList = await provider.getNodeList()
        const json = nodeList.map((node: PossibleNodeConfigType) => {
          const result = { ...node }
          delete result.provider
          return result
        })
        const fileName =
          crypto.createHash('md5').update(provider.url).digest('hex') + '.json'
        const filePath = path.join(localDir, fileName)

        await fs.writeJson(filePath, json, { spaces: 2 })
        this.ora.succeed(`Provider ${providerName} 已保存至 ${filePath}`)
      } catch (err) {
        this.ora.fail(`Provider ${providerName} 处理失败`)
        throw err
      }
    }

    this.ora.succeed('所有 fetchOnce Provider 已处理完毕')
  }
}

GenerateCommand.flags = {
  output: Flags.string({
    char: 'o',
    description: '生成规则的目录',
  }),
  'cache-snippet': Flags.boolean({
    default: false,
    description: '缓存远程片段',
  }),
  'skip-fail': Flags.boolean({
    default: false,
    description: '跳过生成失败的 Artifact',
  }),
  'skip-lint': Flags.boolean({
    default: false,
    description: '跳过代码检查',
  }),
  local: Flags.boolean({
    default: false,
    description: '生成本地阅后即焚 Provider',
  }),
}

export default GenerateCommand
