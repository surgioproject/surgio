import {
  defineClashProvider,
  defineSurgioProject,
} from '../../../build/project/index.js'

const demoProvider = defineClashProvider({
  url: 'https://provider.example/subscription',
})

const output: string = './dist'

export default defineSurgioProject({
  templateDir: './template',
  providers: { demo: demoProvider },
  remoteSnippets: [{ name: 'rules', url: 'https://rules.example/list' }],
  artifacts: [{ name: 'demo.conf', provider: 'demo', template: 'demo' }],
})

export const nodeOptions = async () => ({
  output,
  cache: { type: 'filesystem' },
})
