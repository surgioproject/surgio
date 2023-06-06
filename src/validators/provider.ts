import { z } from 'zod'

import { SupportProviderEnum } from '../types'
import {
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
} from './filter'
import { AfterFetchNodeListHookValidator } from './hooks'

export const ProviderValidator = z.object({
  type: z.nativeEnum(SupportProviderEnum),
  addFlag: z.oboolean(),
  removeExistingFlag: z.oboolean(),
  mptcp: z.oboolean(),
  tfo: z.oboolean(),
  underlyingProxy: z.ostring(),
  startPort: z.number().min(1024).max(65535).optional(),
  relayUrl: z.union([z.boolean(), z.string().url()]).optional(),
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
      afterFetchNodeList: AfterFetchNodeListHookValidator.optional(),
    })
    .optional(),
})