# xvideos

[![Build Status](https://travis-ci.org/rodrigogs/xvideos.svg?branch=master)](https://travis-ci.org/rodrigogs/xvideos)
[![Code Climate](https://codeclimate.com/github/rodrigogs/xvideos/badges/gpa.svg)](https://codeclimate.com/github/rodrigogs/xvideos)
[![Test Coverage](https://codeclimate.com/github/rodrigogs/xvideos/badges/coverage.svg)](https://codeclimate.com/github/rodrigogs/xvideos/coverage)

A a [Node.js](https://nodejs.org) [xvideos.com](xvideos.com) API library.

### Install
```bash
$ npm install @rodrigogs/xvideos
```

### Usage
```javascript
const xvideos = require('@rodrigogs/xvideos');

//-- Inside an async function --//

// Retrieve fresh videos
const fresh = await xvideos.videos.fresh({ page: 1 });
console.log(fresh.videos); // { url, path, title, duration, profile: { name, url }, views, }
console.log(fresh.pagination.current); // 1 
console.log(fresh.pagination.pages); // [1, 2, 3, 4, 5...]
console.log(fresh.hasNext()); // true
console.log(fresh.hasPrevious()); // false

const nextPage = await fresh.next();
console.log(nextPage.pagination.current); // 2
console.log(nextPage.hasNext()); // true
console.log(nextPage.hasPrevious()); // true

const previousPage = await fresh.previous();
console.log(previousPage.pagination.current); // 1
console.log(previousPage.hasNext()); // true
console.log(previousPage.hasPrevious()); // tfalse

const detail = await xvideos.videos.details(fresh.videos[0]); /**
{
  title,
  duration,
  image,
  videoType,
  videoWidth,
  videoHeigth,
  views,
  files: {
    low,
    high,
    HLS,
    thumb,
    thumb69,
    thumbSlide,
    thumbSlideBig
  }
} **/
```

### API
* Retrieve [dashboard videos](https://www.xvideos.com)
  ```javascript
  const dashboardList = await xvideos.videos.dashboard({ page: 1 });
  ```
  * Is there a next page? 
    ```javascript
    console.log(deshboardList.hasNext()); // true or false
    ```
  * Is there a previous page? 
    ```javascript
    console.log(deshboardList.hasPrevious()); // true or false
    ```
  * Refresh page videos
    ```javascript
    const refreshedVideos = await deshboardList.refresh();
    ```
  * Retrieve next deshboard page videos 
    ```javascript
    const nextVideos = await deshboardList.next();
    ```
  * Retrieve previous deshboard page videos
    ```javascript
    const previousVideos = await deshboardList.previous();
    ```
* Retrieve [fresh videos](https://www.xvideos.com/new/1)
  ```javascript
  const freshList = await xvideos.videos.fresh({ page: 1 });
  ```
  * Is there a next page? 
    ```javascript
    console.log(freshList.hasNext()); // true or false
    ```
  * Is there a previous page? 
    ```javascript
    console.log(freshList.hasPrevious()); // true or false
    ```
  * Refresh page videos 
    ```javascript
    const refreshedVideos = await freshList.refresh();
    ```
  * Retrieve next fresh page videos 
    ```javascript
    const nextVideos = await freshList.next();
    ```
  * Retrieve previous fresh page videos
    ```javascript
    const previousVideos = await freshList.previous();
    ```
* Retrieve [best videos](https://www.xvideos.com/best)
  ```javascript
  const bestList = await xvideos.videos.best({ year: '2018', month: '02', page: 1 });
  ```
  * Is there a next page? 
    ```javascript
    console.log(bestList.hasNext()); // true or false
    ```
  * Is there a previous page? 
    ```javascript
    console.log(bestList.hasPrevious()); // true or false
    ```
  * Refresh page videos 
    ```javascript
    const refreshedVideos = await bestList.refresh();
    ```
  * Retrieve next best page videos 
    ```javascript
    const nextVideos = await bestList.next();
    ```
  * Retrieve previous best page videos
    ```javascript
    const previousVideos = await bestList.previous();
    ```
* Retrieve [verified videos](https://www.xvideos.com/verified/videos)
  ```javascript
  const verifiedList = await xvideos.videos.verified({ page: 1 });
  ```
  * Is there a next page? 
    ```javascript
    console.log(verifiedList.hasNext()); // true or false
    ```
  * Is there a previous page? 
    ```javascript
    console.log(verifiedList.hasPrevious()); // true or false
    ```
  * Refresh page videos 
    ```javascript
    const refreshedVideos = await verifiedList.refresh();
    ```
  * Retrieve next verified page videos 
    ```javascript
    const nextVideos = await verifiedList.next();
    ```
  * Retrieve previous verified page videos
    ```javascript
    const previousVideos = await verifiedList.previous();
    ```
* Retrieve [video details](https://www.xvideos.com/video36638661/chaturbate_lulacum69_30-05-2018)
  ```javascript
  const details = await xvideos.videos.details({ url: 'https://www.xvideos.com/video36638661/chaturbate_lulacum69_30-05-2018' });
  ```

* Filter [videos](https://www.xvideos.com/?k=threesome)
  ```javascript
  const videos = await xvideos.videos.details({ k: 'threesome' });
  const videos = await xvideos.videos.details({ k: 'public', page: 5 });
  ```
  * Is there a next page? 
    ```javascript
    console.log(videos.hasNext()); // true or false
    ```
  * Is there a previous page? 
    ```javascript
    console.log(videos.hasPrevious()); // true or false
    ```
  * Refresh page videos 
    ```javascript
    const refreshedVideos = await videos.refresh();
    ```
  * Retrieve next verified page videos 
    ```javascript
    const nextVideos = await videos.next();
    ```
  * Retrieve previous verified page videos
    ```javascript
    const previousVideos = await videos.previous();
    ```

### License
[Licence](https://github.com/rodrigogs/xvideos/blob/master/LICENSE) © Rodrigo Gomes da Silva
