import test from 'ava'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import { getLoonNodes } from '../loon'
import { getQuantumultXNodes } from '../quantumult'
import { getSurfboardNodes } from '../surfboard'

test('unsupported generators omit Tailscale nodes', (t) => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'tailnet',
    },
  ]

  t.is(getLoonNodes(nodeList), '')
  t.is(getQuantumultXNodes(nodeList), '')
  t.is(getSurfboardNodes(nodeList), '')
})
