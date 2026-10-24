declare module 'surgio/worker' {
  export const createSurgioRuntime: (
    manifest: unknown,
    options: Readonly<Record<string, unknown>>,
  ) => unknown
}

declare module 'surgio/cache' {
  export const cache: import('./types.js').GatewayCache
}
