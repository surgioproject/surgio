import { z } from 'zod';
import { SupportProviderEnum } from '../types';

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
  renameNode: z.function().args(z.string()).returns(z.string()).optional(),
});
