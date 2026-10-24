declare module 'nunjucks/src/filters.js' {
  const filters: Record<string, (...args: any[]) => any>
  export default filters
}

declare module 'nunjucks/src/tests.js' {
  const tests: Record<string, (...args: any[]) => any>
  export default tests
}

declare module 'nunjucks/src/globals.js' {
  const globals: () => Record<string, unknown>
  export default globals
}

declare module 'nunjucks/src/lib.js' {
  const lib: any
  export default lib
}

declare module 'nunjucks/src/runtime.js' {
  const runtime: any
  export default runtime
}
