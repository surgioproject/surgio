import { z } from 'zod/v3'

import {
  NodeFilterTypeValidator,
  SortedNodeFilterTypeValidator,
} from './filter.js'

import type { ExtendFunction } from '../generator/json-extend.js'

export const ArtifactValidator = z.object({
  name: z.string(),
  template: z.string(),
  templateType: z
    .union([z.literal('default'), z.literal('json')])
    .default('default'),
  extendTemplate: z
    .custom<ReturnType<ExtendFunction>>(
      (value) => typeof value === 'function',
      'extendTemplate must be a function',
    )
    .optional(),
  provider: z.string(),
  categories: z.array(z.string()).optional(),
  combineProviders: z.array(z.string()).optional(),
  customParams: z.record(z.any()).optional(),
  customFilters: z
    .record(z.union([NodeFilterTypeValidator, SortedNodeFilterTypeValidator]))
    .optional(),
  destDir: z.ostring(),
  destDirs: z.array(z.string()).optional(),
  downloadUrl: z.ostring(),
  templateString: z.ostring(),
  subscriptionUserInfoProvider: z.ostring(),
})
