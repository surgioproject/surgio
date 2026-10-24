import { handle } from 'hono/aws-lambda'

import { createNodeGatewayApp } from './node.js'

import type { NodeGatewayOptions } from './node.js'

export const createLambdaHandler = (options: NodeGatewayOptions = {}) =>
  handle(createNodeGatewayApp(options))
