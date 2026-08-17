import { z } from 'zod/v3'

import { SupportProviderEnum } from '../types.js'

import {
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
} from './filter.js'
import {
  AfterNodeListResponseHookValidator,
  OnErrorHookValidator,
} from './hooks.js'

export const ProviderValidator = z.object({
  type: z.nativeEnum(SupportProviderEnum),
  addFlag: z.oboolean(),
  removeExistingFlag: z.oboolean(),
  mptcp: z.oboolean(),
  tfo: z.oboolean(),
  ecn: z.oboolean(),
  blockQuic: z
    .union([z.literal('auto'), z.literal('on'), z.literal('off')])
    .optional(),
  underlyingProxy: z.ostring(),
  relayUrl: z.string().url().optional(),
  requestUserAgent: z.ostring(),
  renameNode: z
    .function()
    .args(z.string())
    .returns(z.union([z.string(), z.undefined(), z.void()]))
    .optional(),
  customFilters: z
    .record(z.union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator]))
    .optional(),
  nodeFilter: z
    .union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator])
    .optional(),
  netflixFilter: z
    .union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator])
    .optional(),
  youtubePremiumFilter: z
    .union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator])
    .optional(),
  hooks: z
    .object({
      afterNodeListResponse: AfterNodeListResponseHookValidator.optional(),
      onError: OnErrorHookValidator.optional(),
    })
    .optional(),
})
