import { z } from 'zod'

export const ArtifactValidator = z.object({
  name: z.string(),
  template: z.string(),
  provider: z.string(),
  categories: z.array(z.string()).optional(),
  combineProviders: z.array(z.string()).optional(),
  customParams: z.record(z.unknown()).optional(),
  customFilters: z.record(z.function()).optional(),
  destDir: z.ostring(),
  downloadUrl: z.ostring(),
  templateString: z.ostring(),
})
