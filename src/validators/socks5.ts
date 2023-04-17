import { z } from 'zod';

import { NodeTypeEnum } from '../types';
import { PortValidator, SimpleNodeConfigValidator } from './common';

export const Socks5NodeConfigValidator = SimpleNodeConfigValidator.extend({
  type: z.literal(NodeTypeEnum.Socks5),
  hostname: z.string(),
  port: PortValidator,
  username: z.ostring(),
  password: z.ostring(),
  udpRelay: z.oboolean(),
  tls: z.oboolean(),
  skipCertVerify: z.oboolean(),
  sni: z.ostring(),
  clientCert: z.ostring(),
});
