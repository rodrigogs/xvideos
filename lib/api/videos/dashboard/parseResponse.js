const cheerio = require('cheerio');
const parseVideo = require('./parseVideo');
const createRefreshFunction = require('./createRefreshFunction');
const createHasNextFunction = require('./createHasNextFunction');
const createNextFunction = require('./createNextFunction');
const createHasPreviousFunction = require('./createHasPreviousFunction');
const createPreviousFunction = require('./createPreviousFunction');

const getVideos = ($) => {
  return $('#content > .mozaique > .thumb-block')
    .map((i, video) => parseVideo($, video))
    .get();
};

const getPages = ($) => {
  return $('.pagination > ul > li > a')
    .map((i, page) => $(page)
      .text())
    .filter((i, page) => !isNaN(page))
    .map((i, page) => Number(page) - 1)
    .get();
};

const parseResponse = (page, { data }) => {
  const $ = cheerio.load(data);

  const videos = getVideos($);

  const pagination = {
    page,
    pages: getPages($),
  };

  return {
    videos,
    pagination,
    refresh: createRefreshFunction(pagination),
    hasNext: createHasNextFunction(pagination),
    next: createNextFunction(pagination),
    hasPrevious: createHasPreviousFunction(pagination),
    previous: createPreviousFunction(pagination),
  };
};

module.exports = parseResponse;
