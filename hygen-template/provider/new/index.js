'use strict'

const { types } = require('../../../build/internal')
const { SupportProviderEnum } = types

module.exports = {
  prompt: ({ prompter: inquirer }) => {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Provider 类型',
        choices: Object.keys(SupportProviderEnum).map(
          (key) => SupportProviderEnum[key],
        ),
      },
      {
        type: 'input',
        name: 'name',
        message: 'Provider 名称',
      },
      {
        type: 'input',
        name: 'url',
        message: '订阅 URL',
        when: (results) => {
          return [
            SupportProviderEnum.Clash,
            SupportProviderEnum.V2rayNSubscribe,
            SupportProviderEnum.ShadowsocksJsonSubscribe,
            SupportProviderEnum.ShadowsocksrSubscribe,
            SupportProviderEnum.ShadowsocksSubscribe,
            SupportProviderEnum.Trojan,
          ].includes(results.type)
        },
        validate: (str) => /^https?:\/{2}/.test(str),
      },
      {
        type: 'confirm',
        name: 'addFlag',
        message: '是否自动为节点名添加国旗 Emoji（默认开启）',
      },
      {
        type: 'confirm',
        name: 'udpRelay',
        message: '是否强制开启订阅 UDP 转发（默认关闭）',
        default: false,
        when: (results) => {
          return [
            SupportProviderEnum.Clash,
            SupportProviderEnum.ShadowsocksJsonSubscribe,
            SupportProviderEnum.ShadowsocksrSubscribe,
            SupportProviderEnum.ShadowsocksSubscribe,
            SupportProviderEnum.Trojan,
          ].includes(results.type)
        },
      },
      {
        type: 'confirm',
        name: 'relayUrl',
        message:
          '是否开启订阅转发，推荐使用了封锁 now.sh IP 的机场开启（默认关闭）',
        default: false,
        when: (results) => {
          return [
            SupportProviderEnum.Clash,
            SupportProviderEnum.ShadowsocksJsonSubscribe,
            SupportProviderEnum.ShadowsocksrSubscribe,
            SupportProviderEnum.ShadowsocksSubscribe,
            SupportProviderEnum.Trojan,
          ].includes(results.type)
        },
      },
    ])
  },
}
