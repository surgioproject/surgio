import { createGatewayApp } from '@surgio/gateway'
import { createLambdaHandler } from '@surgio/gateway/lambda'
import { createHttpServer, startServer } from '@surgio/gateway/node'
import getFrontendPackage from '@surgio/gateway-frontend'
import {
  createLogger,
  logger,
  setLogLevel,
  type CreateLoggerOptions,
  type Logger,
  type LogLevel,
} from '@surgio/logger'

const options: CreateLoggerOptions = {
  service: 'typescript-consumer',
}
const level: LogLevel = 'info'
const typedLogger: Logger = createLogger(options)

void createGatewayApp
void createHttpServer
void createLambdaHandler
void startServer
void getFrontendPackage
setLogLevel(level)
void typedLogger
void logger
