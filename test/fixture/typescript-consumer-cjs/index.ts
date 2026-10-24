import gateway = require('@surgio/gateway')
import gatewayLambda = require('@surgio/gateway/lambda')
import gatewayNode = require('@surgio/gateway/node')
import getFrontendPackage = require('@surgio/gateway-frontend')
import loggerPackage = require('@surgio/logger')

const frontendPackage = getFrontendPackage()
const logger = loggerPackage.createLogger({
  service: 'typescript-consumer-cjs',
})
loggerPackage.setLogLevel('info')

void gateway.createGatewayApp
void gatewayNode.createHttpServer
void gatewayLambda.createLambdaHandler
void gatewayNode.startServer
void frontendPackage.name
void frontendPackage.version
void logger
void loggerPackage.logger
