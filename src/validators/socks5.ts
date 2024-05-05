import { z } from 'zod'

import { NodeTypeEnum } from '../types'

import { TlsNodeConfigValidator } from './common'

export const Socks5NodeConfigValidator = TlsNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Socks5),
  username: z.ostring(),
  password: z.ostring(),
  udpRelay: z.oboolean(),
  tls: z.oboolean(),
  clientCert: z.ostring(),
})
