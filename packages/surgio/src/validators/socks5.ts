import { z } from 'zod/v3'

import { NodeTypeEnum } from '../types.js'

import { TlsNodeConfigValidator } from './common.js'

export const Socks5NodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Socks5),
  username: z.ostring(),
  password: z.ostring(),
  udpRelay: z.oboolean(),
  tls: z.oboolean(),
  clientCert: z.ostring(),
})
