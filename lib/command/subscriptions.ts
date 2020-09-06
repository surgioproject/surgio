// istanbul ignore file
import Command from 'common-bin';
import { promises as fsp } from 'fs';
import { basename, join } from 'path';
import { createLogger } from '@surgio/logger';

import BlackSSLProvider from '../provider/BlackSSLProvider';
import ClashProvider from '../provider/ClashProvider';
import CustomProvider from '../provider/CustomProvider';
import ShadowsocksJsonSubscribeProvider from '../provider/ShadowsocksJsonSubscribeProvider';
import ShadowsocksrSubscribeProvider from '../provider/ShadowsocksrSubscribeProvider';
import ShadowsocksSubscribeProvider from '../provider/ShadowsocksSubscribeProvider';
import V2rayNSubscribeProvider from '../provider/V2rayNSubscribeProvider';
import { CommandConfig } from '../types';
import { loadConfig } from '../utils/config';
import { getProvider } from '../provider';
import { errorHandler } from '../utils/error-helper';
import { formatSubscriptionUserInfo } from '../utils/subscription';

const logger = createLogger({
  service: 'surgio:SubscriptionsCommand',
});
type PossibleProviderType = BlackSSLProvider|ShadowsocksJsonSubscribeProvider|ShadowsocksSubscribeProvider|CustomProvider|V2rayNSubscribeProvider|ShadowsocksrSubscribeProvider|ClashProvider;

class SubscriptionsCommand extends Command {
  private config: CommandConfig;

  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.usage = '使用方法: surgio subscriptions';
    this.options = {
      c: {
        alias: 'config',
        demandOption: false,
        describe: 'Surgio 配置文件',
        default: './surgio.conf.js',
        type: 'string',
      },
    };
  }

  public async run(ctx): Promise<void> {
    this.config = loadConfig(ctx.cwd, ctx.argv.config);

    const providerList = await this.listProviders();

    for (const provider of providerList) {
      if (provider.supportGetSubscriptionUserInfo) {
        const userInfo = await provider.getSubscriptionUserInfo();

        if (userInfo) {
          const format = formatSubscriptionUserInfo(userInfo);
          console.log('🤟 %s 已用流量：%s 剩余流量：%s 有效期至：%s', provider.name, format.used, format.left, format.expire);
        } else {
          console.log('⚠️  无法查询 %s 的流量信息', provider.name);
        }
      } else {
        console.log('⚠️  无法查询 %s 的流量信息', provider.name);
      }
    }
  }

  // istanbul ignore next
  public get description(): string {
    return '查询订阅流量';
  }

  // istanbul ignore next
  public errorHandler(err): void {
    errorHandler.call(this, err);
  }

  private async listProviders(): Promise<ReadonlyArray<PossibleProviderType>> {
    const files = await fsp.readdir(this.config.providerDir, {
      encoding: 'utf8',
    });
    const providerList: PossibleProviderType[] = [];

    async function readProvider(path): Promise<PossibleProviderType|undefined> {
      let provider;

      try {
        const providerName = basename(path, '.js');

        logger.debug('read %s %s', providerName, path);
        provider = getProvider(providerName, require(path));
      } catch (err) {
        logger.debug(`${path} 不是一个合法的模块`);
        return undefined;
      }

      if (!provider?.type) {
        logger.debug(`${path} 不是一个 Provider`);
        return undefined;
      }

      logger.debug('got provider %j', provider);
      return provider;
    }

    for (const file of files) {
      const result = await readProvider(join(this.config.providerDir, file));
      if (result) {
        providerList.push(result);
      }
    }

    return providerList;
  }
}

export = SubscriptionsCommand;
