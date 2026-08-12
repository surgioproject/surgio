/* istanbul ignore file -- @preserve */
import { promises as fsp } from 'fs'
import { createRequire } from 'module'
import { basename, join } from 'path'
import { createLogger } from '@surgio/logger'

import BaseCommand from '../base-command'
import { getProvider, PossibleProviderType } from '../provider'
import { formatSubscriptionUserInfo } from '../utils'

const requireModule = createRequire(__filename)

const loadCommonJsDefault = <T>(modulePath: string): T => {
  const loadedModule = requireModule(modulePath)

  return loadedModule?.__esModule ? loadedModule.default : loadedModule
}

const logger = createLogger({
  service: 'surgio:SubscriptionsCommand',
})

class SubscriptionsCommand extends BaseCommand<typeof SubscriptionsCommand> {
  static description = '查询订阅信息'

  public async run(): Promise<void> {
    const providerList = await this.listProviders()

    for (const provider of providerList) {
      const { subscriptionUserInfo } = await provider.getNodeListV2()

      if (subscriptionUserInfo) {
        const format = formatSubscriptionUserInfo(subscriptionUserInfo)
        console.log(
          '🤟 %s 已用流量：%s 剩余流量：%s 有效期至：%s',
          provider.name,
          format.used,
          format.left,
          format.expire,
        )
      } else {
        console.log('⚠️  无法查询 %s 的流量信息', provider.name)
      }
    }

    await this.cleanup()
  }

  private async listProviders(): Promise<ReadonlyArray<PossibleProviderType>> {
    const files = await fsp.readdir(this.surgioConfig.providerDir, {
      encoding: 'utf8',
    })
    const providerList: PossibleProviderType[] = []

    async function readProvider(
      path: string,
    ): Promise<PossibleProviderType | undefined> {
      let provider

      try {
        const providerName = basename(path, '.js')
        const providerConfig = loadCommonJsDefault(path)

        logger.debug('read %s %s', providerName, path)

        provider = await getProvider(providerName, providerConfig)
      } catch {
        logger.debug(`${path} 不是一个合法的模块`)
        return undefined
      }

      if (!provider?.type) {
        logger.debug(`${path} 不是一个 Provider`)
        return undefined
      }

      logger.debug('got provider %j', provider)
      return provider
    }

    for (const file of files) {
      const result = await readProvider(
        join(this.surgioConfig.providerDir, file),
      )
      if (result) {
        providerList.push(result)
      }
    }

    return providerList
  }
}

export default SubscriptionsCommand
