# xvideos

[![Build Status](https://travis-ci.org/rodrigogs/xvideos.svg?branch=master)](https://travis-ci.org/rodrigogs/xvideos)
[![Code Climate](https://codeclimate.com/github/rodrigogs/xvideos/badges/gpa.svg)](https://codeclimate.com/github/rodrigogs/xvideos)
[![Test Coverage](https://codeclimate.com/github/rodrigogs/xvideos/badges/coverage.svg)](https://codeclimate.com/github/rodrigogs/xvideos/coverage)

**xvideos** is a node.js [xvideos.com](xvideos.com) api implementation.

### Install
```bash
$ npm install @rodrigogs/xvideos
```

### Usage
```javascript
const xvideos = require('@rodrigogs/xvideos');

// Fresh videos
xvideos.videos.fresh({ page: 1 })
  .then((fresh) => {
    console.log(fresh.videos); // { url, path, title, duration, profile: { name, url }, views, }
    console.log(fresh.pagination.current); // 1 
    console.log(fresh.pagination.pages); // [1, 2, 3, 4, 5...]
    console.log(fresh.hasNext()); // true
    console.log(fresh.hasPrevious()); // false
    
    return fresh.next();
  })
  .then((fresh) => {
    console.log(fresh.videos); // { url, path, title, duration, profile: { name, url }, views, }
    console.log(fresh.pagination.current); // 2
    console.log(fresh.pagination.pages); // [1, 2, 3, 4, 5...]
    console.log(fresh.hasNext()); // true
    console.log(fresh.hasPrevious()); // true

    return fresh.previous();
  });

// Best videos
xvideos.videos.best({ page: 1 })
  .then(/* same as fresh */);
```

### License
[Licence](https://github.com/rodrigogs/xvideos/blob/master/LICENSE) © Rodrigo Gomes da Silva
