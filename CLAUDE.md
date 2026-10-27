# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`jspsych-contrib` is an npm-workspaces monorepo of community-contributed jsPsych (v7+/v8) plugins and extensions. Each package under `packages/` (`plugin-*` / `extension-*`) is published independently as `@jspsych-contrib/<name>`. Packages are community-maintained and vary in quality and completeness; not all have tests, docs, or examples.

## Commands

Run from the repo root:

- `npm ci` — install (also sets up husky; lint-staged runs `prettier --write` on staged ts/js files)
- `npm run build` — build every package (`npm run build -ws`; each package uses rollup via `@jspsych/config`)
- `npm test` — jest across all packages (root jest config uses `packages/*/jest.config.cjs` as projects)
- Single package: run `npm test` inside the package directory, e.g. `cd packages/plugin-pipe && npm test`
- Single test file / name: `npx jest packages/plugin-pipe/src/index.spec.ts -t "name"` from root
- Within a package: `npm run tsc` (type check), `npm run build:watch`, `npm run test:watch`

CI (`.github/workflows/build.yml`) runs `npm ci`, `npm run build`, then `npm test -- --ci --coverage` on Node 18 and 20. Build before testing if tests depend on other workspace packages' `dist`.

## Package layout

Typical package: `src/index.ts` (+ `index.spec.ts`), `rollup.config.mjs`, `jest.config.cjs` (`makePackageConfig(__dirname)` from `@jspsych/config/jest`), `tsconfig.json`, `package.json`, `readme.md`, optional `docs/` (jspsych.org-style docs) and `examples/` (HTML demo). `jspsych` is a peer dependency; tests use `@jspsych/test-utils`. Some packages are plain JS rather than TS.

## Release workflow and generated content

- Every user-visible change needs a changeset: `npm run changeset` (creates a file in `.changeset/`). Versioning/publishing is handled by CI (`changeset:version`, `changeset:publish`).
- `npm run changeset:version` also runs `update-unpkg-links` (gulp, rewrites versioned unpkg URLs in docs/examples) and `update-readme` ([update-readme.js](update-readme.js)).
- The plugin/extension tables in the root [README.md](README.md) are **generated** from each package's `package.json` (`name`, `description`, `author.name`, `author.url`). Edit the package.json, not the table; a missing `author` object breaks the script.

## Style

Prettier with `printWidth: 100` and import-sort (module style) plugin. Contributions should be compatible with jsPsych v7+ (new code targets v8).

## Additional instructions

- We are editting only the folder `packages/plugin-mouse-reading`. No code outside this folder should be changed.

