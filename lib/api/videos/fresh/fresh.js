const base = require('../../base');
const parseResponse = require('./parseResponse');

const PATH = '/new';

const fresh = async ({ page = 1 } = {}) => {
  if (page < 1 || page > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid page: ${page}`);
  }

  const request = base.createRequest({
    url: `${PATH}/${page}`,
  });

  return parseResponse(page, await request.get());
};

module.exports = fresh;
