# Contributing to xvideos

Thanks for helping out! This project is a small, focused Node.js library for
the XVIDEOS API, so we keep the contribution bar low but the quality bar high.

## Requirements

- Node.js 20+ (matches `engines` in `package.json`)
- npm

## Getting started

```bash
npm ci          # install exact dependencies from the lockfile
npm run build   # type-check and emit ESM + CJS + types into dist/
```

## Development loop

```bash
npm run lint          # Biome check (formatting + linting)
npm run format        # auto-fix formatting with Biome
npm run test:unit     # fast unit tests (no network)
npm run test:integration  # live tests against xvideos.com
npm test              # both projects
npm run coverage      # unit tests with 100% coverage gate
```

Always run `npm run lint` and `npm test` before pushing. The CI enforces
them across Node 20, 22, and 24.

## Layout changes on xvideos.com

The repo pins real pages under `test/fixtures/` so a site layout change
breaks a unit test instead of production code. If a fixture test fails
after an intentional XVIDEOS change:

```bash
bash scripts/refresh-fixtures.sh   # re-downloads the real pages
npm run test:unit                  # confirm the parsers still work
```

Then commit the fixture diff together with the parser changes that
followed the site update.

## Releasing

Releases are automated via `.github/workflows/release.yml`:

```bash
npm version minor -m "chore(release): v%s"   # or patch/major
git push origin master --follow-tags
```

Update `CHANGELOG.md` (move the new version section out of `Unreleased`)
BEFORE tagging. The workflow validates (build + lint + unit), publishes to
npm with provenance, and creates a GitHub Release with notes.
