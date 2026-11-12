import { describe, expect, test } from 'vitest'

import { internalFilters } from '../filters/index.js'

import { resolveFilterByName, UnknownFilterError } from './filter.js'

import type { NodeFilterType } from '../types.js'

const myFilter: NodeFilterType = () => true
const providerNetflix: NodeFilterType = () => false
const emptyScope = { customFilters: {}, providerOverrides: {} }

describe('resolveFilterByName', () => {
  test('resolves built-in filters by bare name', () => {
    expect(resolveFilterByName('usFilter', emptyScope)).toBe(
      internalFilters.usFilter,
    )
  })

  test('resolves custom filters with or without the customFilters prefix', () => {
    const scope = { customFilters: { myFilter }, providerOverrides: {} }
    expect(resolveFilterByName('myFilter', scope)).toBe(myFilter)
    expect(resolveFilterByName('customFilters.myFilter', scope)).toBe(myFilter)
  })

  test('prefers a custom filter that shadows a built-in name', () => {
    const scope = {
      customFilters: { usFilter: myFilter },
      providerOverrides: {},
    }
    expect(resolveFilterByName('usFilter', scope)).toBe(myFilter)
  })

  test('applies provider overrides for netflixFilter and youtubePremiumFilter', () => {
    const scope = {
      customFilters: {},
      providerOverrides: { netflixFilter: providerNetflix },
    }
    expect(resolveFilterByName('netflixFilter', scope)).toBe(providerNetflix)
    expect(resolveFilterByName('youtubePremiumFilter', scope)).toBe(
      internalFilters.youtubePremiumFilter,
    )
  })

  test.each([
    'nopeFilter',
    'customFilters.usFilter',
    'toString',
    'customFilters.constructor',
  ])('rejects %s', (name) => {
    expect(() => resolveFilterByName(name, emptyScope)).toThrow(
      new UnknownFilterError(name),
    )
  })
})
