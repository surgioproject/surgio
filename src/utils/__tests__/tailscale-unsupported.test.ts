import { expect, test } from 'vitest'

import { NodeTypeEnum, PossibleNodeConfigType } from '../../types.js'
import { getLoonNodes } from '../loon.js'
import { getQuantumultXNodes } from '../quantumult.js'
import { getSurfboardNodes } from '../surfboard.js'

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
