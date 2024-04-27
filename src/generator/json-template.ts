import { JsonObject } from 'type-fest'
import _ from 'lodash'
import fs from 'fs-extra'
import { join } from 'path'

type ExtendContext = Record<string, any>

type PremitiveValue = string | number | boolean
type ExtendValue =
  | JsonObject[]
  | JsonObject
  | PremitiveValue[]
  | PremitiveValue
  | ((
      extendContext: ExtendContext,
    ) => JsonObject[] | JsonObject | PremitiveValue[] | PremitiveValue)

type ExtendFunction = (
  extendValue: ExtendValue,
) => (jsonInput: JsonObject, extendContext?: ExtendContext) => JsonObject

export const createExtendFunction = (extendKey: string) => {
  const extendFunction: ExtendFunction = (extendValue) => {
    return (jsonInput, extendContext = {}) => {
      const jsonInputCopy = _.cloneDeep(jsonInput)
      const isExist = _.get(jsonInputCopy, extendKey)
      const extendValueIsFunction = _.isFunction(extendValue)
      const valueToExtend = extendValueIsFunction
        ? extendValue(extendContext)
        : extendValue

      if (isExist) {
        if (_.isArray(isExist)) {
          if (_.isArray(valueToExtend)) {
            _.set(jsonInputCopy, extendKey, [...isExist, ...valueToExtend])
          } else {
            _.set(jsonInputCopy, extendKey, [...isExist, valueToExtend])
          }
        } else {
          _.set(jsonInputCopy, extendKey, valueToExtend)
        }
      } else {
        _.set(jsonInputCopy, extendKey, valueToExtend)
      }

      return jsonInputCopy
    }
  }

  return extendFunction
}

export const extendOutbounds = createExtendFunction('outbounds')

export const combineExtendFunctions = (
  ...args: ReturnType<ExtendFunction>[]
): ReturnType<ExtendFunction> => {
  return (jsonInput, extendContext = {}) => {
    return args.reduce((acc, extend) => extend(acc, extendContext), jsonInput)
  }
}

export const render = (
  templateDir: string,
  fileName: string,
  extend: (...args: any[]) => any,
  extendContext: ExtendContext,
): string => {
  const templatePath = join(templateDir, fileName)
  const jsonInput = fs.readJsonSync(templatePath)

  try {
    const jsonOutput = (extend as ReturnType<ExtendFunction>)(
      jsonInput,
      extendContext,
    )

    return JSON.stringify(jsonOutput, null, 2)
  } catch (error) {
    // istanbul ignore next
    if (error instanceof Error) {
      throw new Error(
        `Error when rendering JSON template ${fileName}: ${error.message}`,
      )
    }

    // istanbul ignore next
    throw new Error(`Error when rendering JSON template ${fileName}`)
  }
}
