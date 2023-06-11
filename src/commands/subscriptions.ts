// istanbul ignore file
import { promises as fsp } from 'fs'
import { basename, join } from 'path'
import { createLogger } from '@surgio/logger'

import BaseCommand from '../base-command'
import redis from '../redis'
import { getProvider, PossibleProviderType } from '../provider'
import { formatSubscriptionUserInfo } from '../utils'

const logger = createLogger({
  service: 'surgio:SubscriptionsCommand',
})

class SubscriptionsCommand extends BaseCommand<typeof SubscriptionsCommand> {
  static description = '查询订阅信息'

  public async run(): Promise<void> {
    const providerList = await this.listProviders()

    for (const provider of providerList) {
      if (provider.supportGetSubscriptionUserInfo) {
        const userInfo = await provider.getSubscriptionUserInfo()

        if (userInfo) {
          const format = formatSubscriptionUserInfo(userInfo)
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
      } else {
        console.log('⚠️  无法查询 %s 的流量信息', provider.name)
      }
    }

    await redis.destroyRedis()
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
        const module = await import(path)

        logger.debug('read %s %s', providerName, path)

        // eslint-disable-next-line prefer-const
        provider = await getProvider(providerName, module.default)
      } catch (err) {
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
