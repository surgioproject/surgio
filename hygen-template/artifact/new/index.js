'use strict'

const { basename } = require('path')
const { promises: fsp } = require('fs')
const _ = require('lodash')

const internal = require('../../../build/internal')

module.exports = {
  prompt: ({ prompter: inquirer }) => {
    const config = internal.config.loadConfig(process.cwd())

    return inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Artifact 名称（建议文件名包含后缀，如 .conf）',
        validate: (result) => !!result,
      },
      {
        type: 'list',
        name: 'provider',
        message: 'Provider 名称',
        choices: async () => {
          const files = await listFolder(config.providerDir)

          return _.chain(files)
            .filter((item) => item.endsWith('js'))
            .map((item) => basename(item, '.js'))
            .value()
        },
      },
      {
        type: 'list',
        name: 'template',
        message: 'Template 名称',
        choices: async () => {
          const files = await listFolder(config.templateDir)

          return _.chain(files)
            .filter((item) => item.endsWith('tpl'))
            .map((item) => basename(item, '.tpl'))
            .value()
        },
      },
      {
        type: 'checkbox',
        name: 'combineProviders',
        message: '是否合并其它 Provider（不合并直接回车跳过）',
        choices: async (results) => {
          const files = await listFolder(config.providerDir)

          return _.chain(files)
            .filter((item) => item.endsWith('js'))
            .map((item) => basename(item, '.js'))
            .filter((item) => item !== results.provider)
            .value()
        },
      },
    ])
  },
}

function listFolder(f) {
  return fsp.readdir(f, {
    encoding: 'utf8',
  })
}
