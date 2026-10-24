import { Hook } from '@oclif/core'
import updateNotifier from 'update-notifier'

const hook: Hook<'init'> = async function (opts) {
  Promise.resolve().then(() => {
    updateNotifier({ pkg: opts.config.pjson }).notify()
  })
}

export default hook
