import _ from 'lodash'

import type { JsonObject } from 'type-fest'
import type { ArtifactRenderContext } from '../runtime/artifact.js'

export type ExtendContext = ArtifactRenderContext
type PrimitiveValue = string | number | boolean
/**
 * 允许任意对象和数组，因为 `getSingboxRules` 等方法返回的类型带有 readonly
 * 数组，无法直接赋给 type-fest 的 `JsonObject`。
 */
type ExtendStaticValue = PrimitiveValue | object
type ExtendValue =
  ExtendStaticValue | ((extendContext: ExtendContext) => ExtendStaticValue)
export type ExtendFunction = (
  extendValue: ExtendValue,
) => (
  jsonInput: JsonObject,
  extendContext?: Readonly<Record<string, unknown>>,
) => JsonObject

export const createExtendFunction = (extendKey: string) => {
  const extendFunction: ExtendFunction = (extendValue) => {
    return (jsonInput, extendContext = {}) => {
      const jsonInputCopy = _.cloneDeep(jsonInput)
      const existing = _.get(jsonInputCopy, extendKey)
      const valueToExtend =
        typeof extendValue === 'function'
          ? extendValue(extendContext as ExtendContext)
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
export const extendRoute = createExtendFunction('route')
export const extendDns = createExtendFunction('dns')
export const extendInbounds = createExtendFunction('inbounds')
export const extendRuleSet = createExtendFunction('rules')

export const combineExtendFunctions = (
  ...extendFunctions: ReturnType<ExtendFunction>[]
): ReturnType<ExtendFunction> => {
  return (jsonInput, extendContext = {}) =>
    extendFunctions.reduce(
      (output, extend) => extend(output, extendContext),
      jsonInput,
    )
}
