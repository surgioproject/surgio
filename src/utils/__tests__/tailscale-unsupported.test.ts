import test from 'ava'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import { getLoonNodes } from '../loon'
import { getQuantumultXNodes } from '../quantumult'
import { getSingboxNodes } from '../singbox'
import { getSurfboardNodes } from '../surfboard'

test('unsupported generators omit Tailscale nodes', (t) => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'tailnet',
    },
  ]

  t.deepEqual(getSingboxNodes(nodeList), [])
  t.is(getLoonNodes(nodeList), '')
  t.is(getQuantumultXNodes(nodeList), '')
  t.is(getSurfboardNodes(nodeList), '')
})
