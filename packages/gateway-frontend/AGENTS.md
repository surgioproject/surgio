# AGENTS.md

Guidance for coding agents working on `@surgio/gateway-frontend`. Repository-wide commands, release flow, and conventions live in the root `AGENTS.md`. Run the commands below from this package directory.

## Commands

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

## Architecture

Built with React 19, using:

- **State Management**: MobX 7 with mobx-react-lite
- **Routing**: React Router v7 declarative routes
- **Data Fetching**: SWR (stale-while-revalidate)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind)
- **Styling**: Tailwind CSS 4 with CSS-first theme configuration
- **Build**: Vite with the official React plugin

The frontend is bundled into `build/` and served as static files by the gateway backend. The Vite development server runs on port 3000 and proxies `/api`, `/get-artifact`, `/export-providers`, and `/render` to the gateway on port 4000.

## Testing

- Run a single test file with `pnpm run test:ci -- src/libs/utils.test.ts`
- Test setup file: `src/setupTests.ts`
