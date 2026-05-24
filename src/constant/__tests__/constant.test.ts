import test from 'ava'
import { expectType } from 'ts-expect'
import { z } from 'zod'

import {
  CLASH_META_SUPPORTED_VMESS_NETWORK,
  CLASH_META_SUPPORTED_VLESS_NETWORK,
  V2RAYN_SUPPORTED_VMESS_NETWORK,
} from '../'
import { VlessNetworkValidator, VmessNetworkValidator } from '../../validators'

test('constant', (t) => {
  for (const network of V2RAYN_SUPPORTED_VMESS_NETWORK) {
    expectType<z.infer<typeof VmessNetworkValidator>>(network)
  }

  for (const network of CLASH_META_SUPPORTED_VMESS_NETWORK) {
    expectType<z.infer<typeof VmessNetworkValidator>>(network)
  }

  for (const network of CLASH_META_SUPPORTED_VLESS_NETWORK) {
    expectType<z.infer<typeof VlessNetworkValidator>>(network)
  }

  t.pass()
})
