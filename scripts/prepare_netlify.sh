#!/bin/bash

set -e

# Install pnpm
npm install -g pnpm@7.x

# Install dependencies
pnpm install --frozen-lockfile
