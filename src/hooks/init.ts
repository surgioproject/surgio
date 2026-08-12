import { Hook } from '@oclif/core'
import { createRequire } from 'module'

const requireModule = createRequire(__filename)

type UpdateNotifier = (options: { pkg: unknown }) => { notify(): void }

const loadCommonJsDefault = <T>(moduleName: string): T => {
  const loadedModule = requireModule(moduleName)

  return loadedModule?.__esModule ? loadedModule.default : loadedModule
}

const hook: Hook<'init'> = async function (opts) {
  Promise.resolve().then(() => {
    const updateNotifier =
      loadCommonJsDefault<UpdateNotifier>('update-notifier')

    updateNotifier({ pkg: opts.config.pjson }).notify()
  })
}

export default hook
