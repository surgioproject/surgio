declare namespace espree {
  export interface ParseOptions {
    ecmaVersion?: number
  }

  export interface Node {
    start: number
    end: number
    type: string
  }

  export interface ExpressionStatementNode extends Node {
    type: 'ExpressionStatement'
    expression: CallExpressionNode
  }

  export interface ProgramNode extends Node {
    type: 'Program'
    sourceType: 'script' | 'module'
    body: ExpressionStatementNode[]
  }

  export interface CallExpressionNode extends Node {
    type: 'CallExpression'
    arguments: IdentifierNode[]
    callee: IdentifierNode
  }

  export interface IdentifierNode extends Node {
    type: 'Identifier'
    name: string
  }

  function parse(code: string, options: ParseOptions): ProgramNode
}

declare module 'espree' {
  export = espree
}
