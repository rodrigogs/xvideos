# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-08-07

### Added

- `videos.category({ category, page })` — category video listings by slug (`/c/<slug>`), with 404 handling that surfaces an empty listing for unknown categories.
- `xvideos.configure({ minRequestIntervalMs, proxyUrl })` — process-wide crawl ergonomics: a shared minimum interval between request starts (rate limiting, shared across all clients) and optional HTTP(S) proxy routing.
- Real-HTML fixtures (`test/fixtures/`) pinning the current site layout, with parser tests that fail when XVIDEOS changes its HTML structure. Regenerate with `scripts/refresh-fixtures.sh`.
- npm version/downloads/license badges in the README.

### Changed

- Retry backoff now uses exponential backoff with full jitter instead of a fixed linear delay.
- `configureRequest`/`resetSharedThrottle` are exposed from `base.ts` for programmatic control of the shared throttle.

## [3.1.0] - 2026-04-26

### Added

- `videos.detailsMany()` — ordered batch detail fetching with `concurrency`, `retries`, `retryDelayMs`, and `minDelayMs` options.
- `durationSeconds` and `thumbnailUrl` on every list item.

## [3.0.0] - 2026-04-26

### Changed

- Field normalization: `videos[].path` → `videos[].videoId`, `videos[].views` → `videos[].watchCount`, `details.image` → `details.thumbnailUrls[0]`, `details.views` → `details.watchCount`.
- Richer detail metadata from structured page data (`videoId`, `durationSeconds`, `thumbnailUrls`, `watchCount`, `voteCount`, `ratingPercent`, `uploadDate`, `description`, `contentUrl`, `tags`, `categories`).
