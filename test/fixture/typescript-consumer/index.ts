import {
  categories,
  defineSurgioConfig,
  utils,
  type SurgioConfig,
} from '../../..'

const config: SurgioConfig = {
  artifacts: [],
}

defineSurgioConfig(config)
utils.useKeywords(['Hong Kong'])

const category: string = categories.CLASH

void category
