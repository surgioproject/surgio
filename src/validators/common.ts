import { z } from 'zod'

import { NodeTypeEnum } from '../types'

export const PortValidator = z
  .union([z.string(), z.number()])
  .transform((v, ctx): string | number => {
    const port = Number(v)
    const isInputString = typeof v === 'string'

    if (port > 0 && port < 65536 && Number.isInteger(port)) {
      return isInputString ? `${port}` : port
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '端口号必须为 0 ~ 65535 之间的整数',
      })

      return z.NEVER
    }
  })

export const IntegersVersionValidator = z
  .union([z.string(), z.number()])
  .transform((v, ctx): string | number => {
    const version = Number(v)
    const isInputString = typeof v === 'string'

    if (version > 0 && Number.isInteger(version)) {
      return isInputString ? `${version}` : version
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '版本号必须为大于 0 的整数',
      })

      return z.NEVER
    }
  })

export const SimpleNodeConfigValidator = z.object({
  type: z.nativeEnum(NodeTypeEnum),
  nodeName: z.string(),
  enable: z.boolean().optional(),

  // TCP features
  tfo: z.boolean().optional(),
  mptcp: z.boolean().optional(),
  shadowTls: z
    .object({
      version: IntegersVersionValidator.optional(),
      password: z.string(),
      sni: z.string(),
    })
    .optional(),

  // Misc
  underlyingProxy: z.string().optional(),
  testUrl: z.string().optional(),
})

export const TlsNodeConfigValidator = SimpleNodeConfigValidator.extend({
  hostname: z.string(),
  port: PortValidator,
  tls13: z.oboolean(),
  skipCertVerify: z.oboolean(),
  sni: z.ostring(),
  alpn: z.array(z.string()).nonempty().optional(),
  serverCertFingerprintSha256: z.ostring(),
})
