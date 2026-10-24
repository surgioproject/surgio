# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for the Surgio project containing multiple packages managed by pnpm workspaces, Lerna, and Turbo. Surgio is a network configuration management tool. The repository contains:

- **@surgio/gateway**: Hono-based API Gateway that serves Surgio configuration on Node.js, AWS Lambda, and Cloudflare Workers
- **@surgio/gateway-frontend**: React-based frontend UI for the gateway (built with Vite, Tailwind CSS, MobX, shadcn/ui)
- **@surgio/logger**: Edge-compatible Consola Core logging utility shared across Surgio projects
- **@surgio/eslint-config-surgio**: ESLint configuration for Surgio config stores

## Development Commands

### Monorepo-level Commands

```bash
# Install dependencies
pnpm install

# Build all packages (uses Turbo)
pnpm run build

# Run tests across all packages
pnpm test

# Run TypeScript 6 and native TypeScript 7 checks
pnpm run test:types

# Run unit tests with Istanbul coverage
pnpm run coverage

# Validate ESM package contents and modern Node require compatibility
pnpm run test:package-output

# Run gateway e2e tests
pnpm run test:e2e

# Lint all packages
pnpm run lint

# Release management
pnpm release        # Create new version and publish
pnpm release:beta   # Create beta version and publish with beta tag
```

### Package-specific Commands

Navigate to specific packages for targeted development:

#### Gateway (packages/gateway)

```bash
# Build
pnpm run build

# Build once, then rebuild and restart the server on source changes.
# Serves __tests__/__fixtures__/gateway on port 4000 unless SURGIO_PROJECT_DIR is set
pnpm dev

# Start the Node server from dist/
pnpm start:prod

# Debug mode
pnpm debug

# Run all tests (unit + e2e)
pnpm test

# Run unit tests only
pnpm test:unit

# Run e2e tests only
pnpm run test:e2e

# Watch mode for tests
pnpm test:watch

# Test with coverage
pnpm test:cov

# Lint
pnpm run lint
```

#### Gateway Frontend (packages/gateway-frontend)

```bash
# Development server
pnpm dev

# Build for production
pnpm run build

# Preview the production build
pnpm preview

# Run tests
pnpm test

# Watch tests
pnpm test:watch

# Test with coverage
pnpm test:cov

# Lint
pnpm run lint
```

#### Logger (packages/logger)

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

### Monorepo Structure

- **Build System**: Turbo handles build orchestration with dependency-aware caching
- **Package Manager**: pnpm with workspaces (version: 11.22.0)
- **TypeScript**: TypeScript 6 (`tsc6`) is the configured compiler; native TypeScript 7 (`tsc`) validates compatibility. The root `tsconfig.json` is a solution file whose `references` list every project that `test:types` checks with `tsc -b --noEmit`
- **Backend Framework**: Hono 4 on Web-standard `Request`/`Response`, with `@hono/node-server` for Node.js
- **Frontend Build**: Vite 8 with the official React plugin
- **Test Runner**: Vitest 4 with Istanbul coverage and jsdom for frontend tests
- **Linting**: ESLint 10 with typescript-eslint and @eslint-react
- **Module System**: Native ESM with `module-sync` compatibility for Node.js `require()`
- **Formatter**: Prettier 3
- **Versioning**: Lerna with independent versioning and conventional commits
- **Git Hooks**: Husky + lint-staged for pre-commit checks
- **Commit Convention**: Angular-style conventional commits (enforced by commitlint)

### Gateway Package Architecture

The gateway is a single Hono app. Platform-specific entrypoints wire it to a runtime, a cache, and a static-asset source:

**Source layout** (`src/`):

- `app.ts`: `createGatewayApp()` builds the Hono app and owns every route. Exported from the package root
- `types.ts`: `GatewayRuntime`, `GatewayCache`, `GatewayAssets`, `GatewayLogger`, and `GatewayConfig` interfaces that adapters implement
- `auth.ts`: token and cookie authentication on top of `hono/cookie` and Web Crypto
- `query.ts`: parses nested and array query parameters (`a[b]=1`, `a[]=1`) without prototype pollution
- `node.ts` (`@surgio/gateway/node`): `createNodeGatewayApp()`, `createHttpServer()`, `startServer()`. Loads the project via `surgio/project` and `surgio/runtime/node`, uses `surgio/cache`, and serves the frontend from `@surgio/gateway-frontend/build` on the filesystem
- `lambda.ts` (`@surgio/gateway/lambda`): `createLambdaHandler()` wraps the Node app with `hono/aws-lambda`
- `worker.ts` (`@surgio/gateway/worker`): `createWorkerGateway(manifest, { bindings })` for Cloudflare Workers. Runtime comes from `surgio/worker` and a build-time manifest; cache and assets come from Worker bindings
- `worker-build.ts` (`@surgio/gateway/worker/build`): `buildGatewayWorker()` generates the Surgio manifest and copies frontend assets
- `main.ts`: calls `startServer()` with `SURGIO_PROJECT_DIR` as the project directory when set; used by `pnpm start:prod` and `pnpm dev`

**Request handling**:

- `runtime`, `cache`, and `assets` in `GatewayAppOptions` can be values or per-request functions of the Hono context, so Worker bindings resolve lazily per environment
- Authentication is a `requireRole('admin' | 'viewer')` middleware. Admin and viewer tokens come from the Surgio gateway config; a signed `_t` cookie grants admin
- Render routes (`/get-artifact/:name`, `/export-providers`, `/render`) can serve cached bodies on error when `useCacheOnError` is set; TTL is `SURGIO_RENDERED_ARTIFACT_CACHE_MAXAGE` or seven days
- `/api/*` responses carry a no-store cache-control header
- Unknown routes fall through to the assets source, which returns `index.html` for SPA paths

**Testing Strategy**:

- Unit tests: `*.spec.ts` files in `src/`. `app.spec.ts` drives `createGatewayApp()` with a stub runtime; `app.edge.spec.ts` bundles the app with esbuild to prove it has no Node dependencies
- E2E tests: `*.e2e-spec.ts` files in `__tests__/e2e/`, covering the Node HTTP server and the AWS Lambda adapter
- Test fixtures in `__tests__/__fixtures__/`
- Separate Vitest configs for unit vs e2e

### Gateway Frontend Architecture

Built with React 19, using:

- **State Management**: MobX 7 with mobx-react-lite
- **Routing**: React Router v7 declarative routes
- **Data Fetching**: SWR (stale-while-revalidate)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind)
- **Styling**: Tailwind CSS 4 with CSS-first theme configuration
- **Build**: Vite with the official React plugin

The frontend is bundled into `build/` and served as static files by the gateway backend. The Vite development server runs on port 3000 and proxies `/api`, `/get-artifact`, `/export-providers`, and `/render` to the gateway on port 4000.

### Logger Package

Cross-runtime logger factory built on `consola/core`:

- Provides `createLogger()`, the default `logger`, and `setLogLevel()`
- Runs in Node.js and Web-standard Edge Workers without Node compatibility shims
- Log level defaults from `SURGIO_LOG_LEVEL` when `process.env` exists, otherwise `info`
- Formats: timestamp, label (service name), level, message
- Colorizes levels only in interactive Node development terminals
- The public API exposes Surgio's own `Logger` and `LogLevel` types, not implementation-specific transports

## Important Technical Details

### Surgio Integration

The gateway depends on the main `surgio` package (peer dependency, v4). It imports Surgio's native ESM subpath exports directly and only from platform entrypoints, so `app.ts` stays runtime-agnostic:

- `surgio/project` and `surgio/runtime/node`: load `surgio.project.ts` from `cwd` and create the Node runtime
- `surgio/cache`: default Node cache
- `surgio/worker` and `surgio/worker/build`: Worker runtime from a manifest, and manifest generation

The Surgio subpaths are imported through variables so bundlers for other targets do not resolve them.

### Workspace Dependencies

The gateway package uses `workspace:*` protocol to depend on `@surgio/gateway-frontend` and `@surgio/logger`, ensuring it always uses the local workspace version.

## Testing

### Running Single Tests

```bash
# Unit test for specific file
cd packages/gateway
pnpm run test:unit -- app.spec.ts

# E2E test for specific file
cd packages/gateway
pnpm run test:e2e -- adapters.e2e-spec.ts

# Frontend test for specific file
cd packages/gateway-frontend
pnpm run test:ci -- src/libs/utils.test.ts
```

### Test Setup Files

- Gateway unit tests: `__tests__/setup-tests.ts`
- Gateway e2e tests: `__tests__/setup-e2e-tests.ts` (points `SURGIO_PROJECT_DIR` at the gateway fixture)
- Frontend tests: `src/setupTests.ts`

### CI Validation

CI builds all packages, runs TypeScript 6 and native TypeScript 7 checks,
lints the workspace, validates package output, collects unit-test coverage,
and runs gateway e2e tests. Coverage is generated with Vitest and Istanbul.

The ESM and CommonJS TypeScript consumer fixtures validate the public
declarations for gateway, gateway frontend, and logger with both compilers.
They resolve `@surgio/*` to built `dist/` declarations, so `pnpm run build`
must run before `pnpm run test:types`.
The package-output test runs `pnpm pack --dry-run --json` for every published
package and checks ESM entrypoints, `module-sync` require compatibility,
declaration files, and excluded test output. It also parses the built frontend
HTML and verifies that every local JavaScript and CSS asset is present in the
published tarball.

## Release Process

1. Lerna manages versions independently for each package
2. Conventional commits determine version bumps automatically
3. `pnpm release` runs `lerna version` (prompts for confirmation) then `lerna publish from-git`
4. Beta releases use `--preid beta` flag and publish to `@beta` dist-tag
5. Build step runs automatically via `prepublishOnly` script

## Node Version Requirement

All packages require Node.js >= 22.22.2. Published packages contain one native
ESM runtime build; synchronous CommonJS consumers use Node.js `module-sync`
interop rather than a separate CommonJS artifact.
