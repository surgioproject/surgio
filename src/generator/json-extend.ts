import _ from 'lodash'

import type { JsonObject } from 'type-fest'

export type ExtendContext = Record<string, any>
type PrimitiveValue = string | number | boolean
type ExtendValue =
  | JsonObject[]
  | JsonObject
  | PrimitiveValue[]
  | PrimitiveValue
  | ((
      extendContext: ExtendContext,
    ) => JsonObject[] | JsonObject | PrimitiveValue[] | PrimitiveValue)
export type ExtendFunction = (
  extendValue: ExtendValue,
) => (jsonInput: JsonObject, extendContext?: ExtendContext) => JsonObject

export const createExtendFunction = (extendKey: string) => {
  const extendFunction: ExtendFunction = (extendValue) => {
    return (jsonInput, extendContext = {}) => {
      const jsonInputCopy = _.cloneDeep(jsonInput)
      const existing = _.get(jsonInputCopy, extendKey)
      const valueToExtend = _.isFunction(extendValue)
        ? extendValue(extendContext)
        : extendValue

      if (_.isArray(existing)) {
        _.set(
          jsonInputCopy,
          extendKey,
          _.isArray(valueToExtend)
            ? [...existing, ...valueToExtend]
            : [...existing, valueToExtend],
        )
      } else if (_.isPlainObject(existing) && _.isPlainObject(valueToExtend)) {
        _.set(
          jsonInputCopy,
          extendKey,
          _.mergeWith(
            {},
            existing,
            valueToExtend,
            (objectValue: unknown, sourceValue: unknown) =>
              _.isArray(objectValue) && _.isArray(sourceValue)
                ? [...objectValue, ...sourceValue]
                : undefined,
          ),
        )
      } else {
        _.set(jsonInputCopy, extendKey, valueToExtend)
      }
      return jsonInputCopy
    }
  }
  return extendFunction
}

export const extendOutbounds = createExtendFunction('outbounds')
export const extendEndpoints = createExtendFunction('endpoints')

export const combineExtendFunctions = (
  ...extendFunctions: ReturnType<ExtendFunction>[]
): ReturnType<ExtendFunction> => {
  return (jsonInput, extendContext = {}) =>
    extendFunctions.reduce(
      (output, extend) => extend(output, extendContext),
      jsonInput,
    )
}
