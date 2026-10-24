# AGENTS.md

Guidance for coding agents working on `@surgio/gateway`. Repository-wide commands, release flow, and conventions live in the root `AGENTS.md`. Run the commands below from this package directory.

## Commands

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

## Architecture

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

## Surgio Integration

The gateway depends on the main `surgio` package (peer dependency, v4). It imports Surgio's native ESM subpath exports directly and only from platform entrypoints, so `app.ts` stays runtime-agnostic:

- `surgio/project` and `surgio/runtime/node`: load `surgio.project.ts` from `cwd` and create the Node runtime
- `surgio/cache`: default Node cache
- `surgio/worker` and `surgio/worker/build`: Worker runtime from a manifest, and manifest generation

The Surgio subpaths are imported through variables so bundlers for other targets do not resolve them.

## Workspace Dependencies

The gateway package uses `workspace:*` protocol to depend on `@surgio/gateway-frontend`, `@surgio/logger`, and (as a dev dependency) `surgio`, so builds and tests always run against the local workspace versions.

## Running Single Tests

```bash
# Unit test for specific file
pnpm run test:unit -- app.spec.ts

# E2E test for specific file
pnpm run test:e2e -- adapters.e2e-spec.ts
```

## Test Setup Files

- Gateway unit tests: `__tests__/setup-tests.ts`
- Gateway e2e tests: `__tests__/setup-e2e-tests.ts` (points `SURGIO_PROJECT_DIR` at the gateway fixture)
