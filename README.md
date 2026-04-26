# xvideos

[![CI](https://github.com/rodrigogs/xvideos/actions/workflows/node.js.yml/badge.svg)](https://github.com/rodrigogs/xvideos/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/rodrigogs/xvideos/graph/badge.svg)](https://codecov.io/gh/rodrigogs/xvideos)
[![CodeQL](https://github.com/rodrigogs/xvideos/actions/workflows/codeql.yml/badge.svg)](https://github.com/rodrigogs/xvideos/actions/workflows/codeql.yml)

A [Node.js](https://nodejs.org) library for the [xvideos.com](https://www.xvideos.com) API.

Requires Node.js 20+.

## Installation

```bash
$ npm install @rodrigogs/xvideos
```

## Usage

```javascript
import xvideos from '@rodrigogs/xvideos';
```

```javascript
const xvideos = require('@rodrigogs/xvideos');

(async () => {
  // Retrieve fresh videos from the first page
  const fresh = await xvideos.videos.fresh({ page: 1 });
  // Log details of the retrieved videos
  console.log(fresh.videos); // Array of video objects with properties like url, videoId, title, duration, profile, watchCount
  console.log(fresh.pagination.page); // Current page number
  console.log(fresh.pagination.pages); // Array of available page numbers
  console.log(fresh.hasNext()); // Check if there is a next page
  console.log(fresh.hasPrevious()); // Check if there is a previous page

  // Retrieve the next page of fresh videos
  const nextPage = await fresh.next();
  // Log details of the next page
  console.log(nextPage.pagination.page); // Updated current page number
  console.log(nextPage.hasNext()); // Check if the next page exists
  console.log(nextPage.hasPrevious()); // Check if the previous page exists

  // Retrieve the previous page of fresh videos
  const previousPage = await fresh.previous();
  // Log details of the previous page
  console.log(previousPage.pagination.page); // Updated current page number
  console.log(previousPage.hasNext()); // Check if the next page exists
  console.log(previousPage.hasPrevious()); // Check if the previous page exists

  // Retrieve detailed information about a specific video
  const detail = await xvideos.videos.details(fresh.videos[0]);
  // Log details of the specific video
  console.log(detail); // Detailed video object with properties like title, videoId, duration, durationSeconds, thumbnailUrls, watchCount, videoType, files, uploadDate, tags, categories
})();
```

## Development

```bash
npm run build
npm run lint
npm run format
npm run test:unit
npm run test:integration
npm run coverage
npm test
```

## Migration Notes

### Version 3.0 field normalization

Some fields were normalized to remove redundant data while keeping all information available:

| Previous field | New field | Notes |
|---|---|---|
| `videos[].path` | `videos[].videoId` | Use `video.url` if you need full link, or rebuild path with `/${video.videoId}` when required. |
| `videos[].views` | `videos[].watchCount` | Numeric form for sorting/filtering. |
| `details.image` | `details.thumbnailUrls[0]` | Primary thumbnail remains available as first item. |
| `details.views` | `details.watchCount` | Numeric form for analytics and ranking. |

### New fields added

- `details.videoId`
- `details.durationSeconds`
- `details.thumbnailUrls`
- `details.watchCount`
- `details.voteCount`
- `details.ratingPercent`
- `details.uploadDate`
- `details.description`
- `details.contentUrl`
- `details.tags`
- `details.categories`

These changes keep feature parity and add richer metadata from structured page data.

## API

### Retrieve [Dashboard Videos](https://www.xvideos.com)

```javascript
// Retrieve dashboard videos from the first page
const dashboardList = await xvideos.videos.dashboard({ page: 1 });

// Check if there is a next page of results
console.log(dashboardList.hasNext()); // Outputs: true or false

// Check if there is a previous page of results
console.log(dashboardList.hasPrevious()); // Outputs: true or false

// Refresh the current page of results to get updated data
const refreshedVideos = await dashboardList.refresh();

// Retrieve the next page of dashboard videos if available
const nextVideos = await dashboardList.next();

// Retrieve the previous page of dashboard videos if available
const previousVideos = await dashboardList.previous();
```

### Retrieve [Fresh Videos](https://www.xvideos.com/new/1)

```javascript
// Retrieve fresh videos from the first page
const freshList = await xvideos.videos.fresh({ page: 1 });

// Check if there is a next page of results
console.log(freshList.hasNext()); // Outputs: true or false

// Check if there is a previous page of results
console.log(freshList.hasPrevious()); // Outputs: true or false

// Refresh the current page of results to get updated data
const refreshedVideos = await freshList.refresh();

// Retrieve the next page of fresh videos if available
const nextVideos = await freshList.next();

// Retrieve the previous page of fresh videos if available
const previousVideos = await freshList.previous();
```

### Retrieve [Best Videos](https://www.xvideos.com/best)

```javascript
// Retrieve best videos for a specific year and month, starting from the first page
const bestList = await xvideos.videos.best({ year: '2018', month: '02', page: 1 });

// Check if there is a next page of results
console.log(bestList.hasNext()); // Outputs: true or false

// Check if there is a previous page of results
console.log(bestList.hasPrevious()); // Outputs: true or false

// Refresh the current page of results to get updated data
const refreshedVideos = await bestList.refresh();

// Retrieve the next page of best videos if available
const nextVideos = await bestList.next();

// Retrieve the previous page of best videos if available
const previousVideos = await bestList.previous();
```

### Retrieve [Verified Videos](https://www.xvideos.com/verified/videos)

```javascript
// Retrieve verified videos from the first page
const verifiedList = await xvideos.videos.verified({ page: 1 });

// Check if there is a next page of results
console.log(verifiedList.hasNext()); // Outputs: true or false

// Check if there is a previous page of results
console.log(verifiedList.hasPrevious()); // Outputs: true or false

// Refresh the current page of results to get updated data
const refreshedVideos = await verifiedList.refresh();

// Retrieve the next page of verified videos if available
const nextVideos = await verifiedList.next();

// Retrieve the previous page of verified videos if available
const previousVideos = await verifiedList.previous();
```

### Retrieve [Video Details](https://www.xvideos.com/video36638661/chaturbate_lulacum69_30-05-2018)

```javascript
// Retrieve detailed information about a specific video using its URL
const details = await xvideos.videos.details({ url: 'https://www.xvideos.com/video36638661/chaturbate_lulacum69_30-05-2018' });

// Log detailed information about the video
console.log(details); // Detailed video object with properties like title, videoId, duration, durationSeconds, thumbnailUrls, watchCount, videoType, files, uploadDate, description, contentUrl, tags, categories, voteCount, ratingPercent
```

### Filter [Videos](https://www.xvideos.com/?k=threesome)

```javascript
// Search for videos using a keyword, and optionally specify a page number
const videos = await xvideos.videos.search({ k: 'threesome' });
// Example with a specific page number
// const videos = await xvideos.videos.search({ k: 'public', page: 5 });

// Check if there is a next page of results
console.log(videos.hasNext()); // Outputs: true or false

// Check if there is a previous page of results
console.log(videos.hasPrevious()); // Outputs: true or false

// Refresh the current page of results to get updated data
const refreshedVideos = await videos.refresh();

// Retrieve the next page of videos if available
const nextVideos = await videos.next();

// Retrieve the previous page of videos if available
const previousVideos = await videos.previous();

// Search for videos with specific parameters
const videos = await xvideos.videos.search({
  page: 2,
  k: 'threesome',
  sort: 'rating',
  datef: 'week',
  durf: '3-10min',
  quality: 'hd'
});

// Log the search results
console.log(videos); // Array of video objects with properties based on the search parameters
```

#### Params explanation

| Parameter | Default        | Options                                                                                  |
|-----------|----------------|------------------------------------------------------------------------------------------|
| `page`    | `1`            | (any positive integer)                                                                   |
| `k`       | `""`           | (any search keyword)                                                                     |
| `sort`    | `"relevance"`  | `"uploaddate"`, `"rating"`, `"length"`, `"views"`, `"random"`                            |
| `datef`   | `"all"`        | `"today"`, `"week"`, `"month"`, `"3month"`, `"6month"`, `"all"`                         |
| `durf`    | `"allduration"`| `"1-3min"`, `"3-10min"`, `"10min_more"`, `"10-20min"`, `"20min_more"`, `"allduration"` |
| `quality` | `"all"`        | `"hd"`, `"1080P"`, `"all"`                                                                |



---

### License
[Licence](https://github.com/rodrigogs/xvideos/blob/master/LICENSE) © Rodrigo Gomes da Silva
