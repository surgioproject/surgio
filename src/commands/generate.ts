import { Flags } from '@oclif/core'
import fs from 'fs-extra'
import path from 'path'

import BaseCommand from '../base-command'
import { Artifact, getEngine } from '../generator'
import redis from '../redis'
import { ArtifactConfig } from '../types'
import { setConfig } from '../config'
import { checkAndFix } from '../utils/linter'
import { loadRemoteSnippetList } from '../utils'

class GenerateCommand extends BaseCommand<typeof GenerateCommand> {
  static description = '生成规则'

  public async run(): Promise<void> {
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

    await redis.destroyRedis()
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
    const templateEngine = getEngine(config.templateDir)

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
}

export default GenerateCommand
