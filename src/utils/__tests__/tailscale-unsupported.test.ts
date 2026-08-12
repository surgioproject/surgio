import { expect, test } from 'vitest'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types'
import { getLoonNodes } from '../loon'
import { getQuantumultXNodes } from '../quantumult'
import { getSurfboardNodes } from '../surfboard'

test('unsupported generators omit Tailscale nodes', () => {
  const nodeList: ReadonlyArray<PossibleNodeConfigType> = [
    {
      type: NodeTypeEnum.Tailscale,
      nodeName: 'tailnet',
    },
  ]

  expect(getLoonNodes(nodeList)).toBe('')
  expect(getQuantumultXNodes(nodeList)).toBe('')
  expect(getSurfboardNodes(nodeList)).toBe('')
})
