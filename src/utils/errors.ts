import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

type SurgioErrorOptions = {
  providerName?: string
  providerPath?: string
  nodeIndex?: number
  cause?: unknown
}

class SurgioError extends Error {
  public providerName?: string
  public providerPath?: string
  public nodeIndex?: number
  public cause?: unknown

  constructor(message: string, options: SurgioErrorOptions = {}) {
    super(message)

    this.name = 'SurgioError'
    this.providerName = options.providerName
    this.providerPath = options.providerPath
    this.nodeIndex = options.nodeIndex
    this.cause = options.cause
  }

  format(): string {
    const message: string[] = []

    message.push(this.name + ': ' + this.message)
    if (this.providerName) {
      message.push(`Provider 名称: ${this.providerName}`)
    }
    if (this.providerPath) {
      message.push(`文件地址: ${this.providerPath}`)
    }
    if (typeof this.nodeIndex === 'number') {
      message.push(`错误发生在第 ${this.nodeIndex + 1} 个节点`)
    }
    if (isZodError(this.cause)) {
      message.push(
        fromZodError(this.cause, {
          prefix: '原因',
        }).message,
      )
    } else if (isError(this.cause) && this.cause.stack) {
      message.push(' ')
      message.push(this.cause.stack)
    } else if (this.stack) {
      message.push(' ')
      message.push(this.stack)
    }

    return message.join('\n')
  }
}

export const isSurgioError = (val: unknown): val is SurgioError => {
  return val instanceof SurgioError
}

export const isZodError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError
}

export const isError = (val: unknown): val is Error => {
  return val instanceof Error
}

export { SurgioError }
