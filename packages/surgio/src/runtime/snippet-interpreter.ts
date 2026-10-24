export interface RestrictedSnippetMacro {
  readonly arguments: readonly string[]
  render(args: readonly string[]): string
}

type Segment =
  | { readonly type: 'text'; value: string }
  | {
      readonly type: 'variable'
      readonly name: string
      readonly offset: number
    }

const identifierPattern = /^[A-Za-z_$][\w$]*$/

const locationAt = (source: string, offset: number): string => {
  const before = source.slice(0, offset)
  const lines = before.split('\n')
  return `${lines.length}:${(lines.at(-1)?.length ?? 0) + 1}`
}

const syntaxError = (source: string, offset: number, message: string): Error =>
  new Error(`${message} (${locationAt(source, offset)})`)

const trimPrevious = (segments: Segment[]): void => {
  const previous = segments.at(-1)
  if (previous?.type === 'text') {
    previous.value = previous.value.replace(/\s+$/, '')
  }
}

export const parseRestrictedSnippet = (
  source: string,
): RestrictedSnippetMacro => {
  const segments: Segment[] = []
  let argumentsList: string[] | undefined
  let cursor = 0
  let inMacro = false
  let macroClosed = false
  let trimNext = false

  const appendText = (value: string): void => {
    const text = trimNext ? value.replace(/^\s+/, '') : value
    trimNext = false
    if (inMacro && text) {
      segments.push({ type: 'text', value: text })
    } else if (!inMacro && text.trim()) {
      throw syntaxError(source, cursor, '宏定义之外只能包含空白或注释')
    }
  }

  while (cursor < source.length) {
    const opening = source.slice(cursor).search(/{[{%#]/)
    if (opening === -1) {
      appendText(source.slice(cursor))
      cursor = source.length
      break
    }

    const tokenStart = cursor + opening
    appendText(source.slice(cursor, tokenStart))
    const opener = source.slice(tokenStart, tokenStart + 2)
    const closer = opener === '{{' ? '}}' : opener === '{%' ? '%}' : '#}'
    const closeAt = source.indexOf(closer, tokenStart + 2)
    if (closeAt === -1) {
      throw syntaxError(source, tokenStart, `未闭合的 ${opener} 标记`)
    }

    const leftTrim = source[tokenStart + 2] === '-'
    const rightTrim = source[closeAt - 1] === '-'
    const contentStart = tokenStart + 2 + (leftTrim ? 1 : 0)
    const contentEnd = closeAt - (rightTrim ? 1 : 0)
    const content = source.slice(contentStart, contentEnd).trim()
    if (leftTrim) {
      trimPrevious(segments)
    }

    if (opener === '{#') {
      // Comments are accepted both inside and outside the macro.
    } else if (opener === '{{') {
      if (!inMacro) {
        throw syntaxError(source, tokenStart, '宏定义之外不允许插值')
      }
      if (!identifierPattern.test(content)) {
        throw syntaxError(source, tokenStart, '插值只允许使用宏参数标识符')
      }
      segments.push({ type: 'variable', name: content, offset: tokenStart })
    } else if (/^macro\b/.test(content)) {
      if (inMacro || argumentsList || macroClosed) {
        throw syntaxError(source, tokenStart, '只允许定义一个 main 宏')
      }
      const match = content.match(/^macro\s+main\s*\(([^)]*)\)\s*$/)
      if (!match) {
        throw syntaxError(source, tokenStart, '只允许定义 main(arg, ...) 宏')
      }
      argumentsList = match[1].trim()
        ? match[1].split(',').map((item) => item.trim())
        : []
      for (const argument of argumentsList) {
        if (!identifierPattern.test(argument)) {
          throw syntaxError(source, tokenStart, `无效的宏参数 ${argument}`)
        }
      }
      if (new Set(argumentsList).size !== argumentsList.length) {
        throw syntaxError(source, tokenStart, '宏参数不能重复')
      }
      inMacro = true
    } else if (content === 'endmacro') {
      if (!inMacro) {
        throw syntaxError(source, tokenStart, 'endmacro 没有对应的宏')
      }
      inMacro = false
      macroClosed = true
    } else {
      throw syntaxError(source, tokenStart, `不支持的控制语法: ${content}`)
    }

    trimNext = rightTrim
    cursor = closeAt + 2
  }

  if (!argumentsList) {
    throw new Error('该片段不包含可用的 main 宏')
  }
  if (inMacro) {
    throw new Error('main 宏缺少 endmacro')
  }

  const knownArguments = new Set(argumentsList)
  for (const segment of segments) {
    if (segment.type === 'variable' && !knownArguments.has(segment.name)) {
      throw syntaxError(source, segment.offset, `未知变量 ${segment.name}`)
    }
  }

  return {
    arguments: argumentsList,
    render(args) {
      if (args.length < argumentsList!.length) {
        throw new Error(
          `Surgio 片段参数不足，缺少 ${argumentsList![args.length]}`,
        )
      }
      if (args.length > argumentsList!.length) {
        throw new Error(
          `Surgio 片段需要 ${argumentsList!.length} 个参数，实际收到 ${args.length} 个`,
        )
      }
      const values = new Map<string, string>()
      argumentsList!.forEach((name, index) => {
        if (typeof args[index] !== 'string') {
          throw new Error(`Surgio 片段参数 ${name} 不为字符串`)
        }
        values.set(name, args[index])
      })
      return segments
        .map((segment) =>
          segment.type === 'text' ? segment.value : values.get(segment.name)!,
        )
        .join('')
        .trim()
    },
  }
}

export const renderRestrictedSnippet = (
  source: string,
  args: readonly string[],
): string => parseRestrictedSnippet(source).render(args)
