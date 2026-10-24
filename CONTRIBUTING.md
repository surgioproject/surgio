# CONTRIBUTING

## Development

This repository is a pnpm workspace. The `surgio` CLI lives in `packages/surgio`, and the other npm packages live next to it under `packages/`.

- Run `pnpm install` and `pnpm run build` in the repository root
- Run `pnpm run dev` to start the development toolchain of `surgio`
- Run `pnpm link -g` in `packages/surgio` to link the package globally
- Run `pnpm link -g surgio` in your local surgio config repository to use the local version of surgio
- Run generate command to check the result

## Testing

- Run `pnpm run test` to run the tests
- Tests will be automatically checked by GitHub Actions
- A green pipeline is required to merge a PR

## Versioning

- Every package is versioned independently by Lerna
- Commit messages follow the Angular convention, and Lerna derives each version bump from them
- Run `pnpm release` or `pnpm release:beta` in the repository root to version, tag, and publish the changed packages

## Documentation

- Run `pnpm run docs:dev` to start the live preview of the documentation
- Add version tag in Markdown if the feature is only available in/after a specific version
