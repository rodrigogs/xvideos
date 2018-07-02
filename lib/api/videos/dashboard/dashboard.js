const base = require('../../base');
const parseResponse = require('./parseResponse');

const PATH = '/verified/videos';

const best = async ({ page = 1 } = {}) => {
  if (page < 1 || page > Number.MAX_VALUE) {
    throw new Error(`Invalid page: ${page}`);
  }

  const request = base.createRequest({
    url: `${PATH}/${page === 0 ? '' : page}`,
  });

  return parseResponse(page, await request.get());
};

module.exports = best;
