import { Hook } from '@oclif/core'

import { loadModuleSync } from '../utils/module-loader.js'

type UpdateNotifier = (options: { pkg: unknown }) => { notify(): void }

const hook: Hook<'init'> = async function (opts) {
  Promise.resolve().then(() => {
    const updateNotifier = loadModuleSync<UpdateNotifier>('update-notifier')

    updateNotifier({ pkg: opts.config.pjson }).notify()
  })
}

export default hook
