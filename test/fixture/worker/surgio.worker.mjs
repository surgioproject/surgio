import {
  defineClashProvider,
  defineWorkerProject,
} from '../../../build/worker/config.js'

const demoProvider = defineClashProvider({
  url: 'https://provider.example/subscription',
})

export default defineWorkerProject({
  templateDir: './template',
  providers: { demo: demoProvider },
  config: {
    remoteSnippets: [{ name: 'rules', url: 'https://rules.example/list' }],
    artifacts: [{ name: 'demo.conf', provider: 'demo', template: 'demo' }],
  },
})
