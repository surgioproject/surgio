// istanbul ignore file
import { Args, ux } from '@oclif/core'
import fs from 'fs-extra'
import path from 'path'
import inquirer from 'inquirer'

import BaseCommand from '../base-command'
import redis from '../redis'
import { getConfig } from '../config'
import { getProvider } from '../provider'

class CheckCommand extends BaseCommand<typeof CheckCommand> {
  static description = '查询 Provider'

  static args = {
    provider: Args.string({
      description: '发起检查的 Provider',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const nodeList = await this.getNodeList(this.args.provider)

    if (!process.stdin.isTTY) {
      console.log(JSON.stringify(nodeList, null, 2))
      return
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'node',
        message: '请选择节点',
        choices: nodeList.map((node) => {
          const name =
            'hostname' in node && 'port' in node
              ? `${node.nodeName} - ${node.hostname}:${node.port}`
              : node.nodeName

          return {
            name,
            value: node,
          }
        }),
      },
    ])

    console.log(JSON.stringify(answers.node, null, 2))

    await redis.destroyRedis()
  }

  private async getNodeList(providerName: string) {
    ux.action.start('正在获取 Provider 信息')

    const config = getConfig()
    const filePath = path.resolve(config.providerDir, `./${providerName}.js`)
    const file: any | Error = fs.existsSync(filePath)
      ? await import(filePath)
      : new Error('找不到该 Provider')

    if (file instanceof Error) {
      throw file
    }

    const provider = await getProvider(providerName, file.default)
    const nodeList = await provider.getNodeList()

    ux.action.stop()

    return nodeList
  }
}

export default CheckCommand
