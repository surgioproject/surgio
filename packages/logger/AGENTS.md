# AGENTS.md

Guidance for coding agents working on `@surgio/logger`. Repository-wide commands, release flow, and conventions live in the root `AGENTS.md`. Run the commands below from this package directory.

## Commands

```bash
# Build
pnpm run build

# Test
pnpm test

# Watch tests
pnpm test:watch

# Test with coverage
pnpm test:cov

# Lint
pnpm run lint
```

## Architecture

Cross-runtime logger factory built on `consola/core`:

- Provides `createLogger()`, the default `logger`, and `setLogLevel()`
- Runs in Node.js and Web-standard Edge Workers without Node compatibility shims
- Log level defaults from `SURGIO_LOG_LEVEL` when `process.env` exists, otherwise `info`
- Formats: timestamp, label (service name), level, message
- Colorizes levels only in interactive Node development terminals
- The public API exposes Surgio's own `Logger` and `LogLevel` types, not implementation-specific transports
