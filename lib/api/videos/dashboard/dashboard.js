const base = require('../../base');
const parseResponse = require('./parseResponse');

const PATH = '/verified/videos';

const dashboard = async ({ page = 1 } = {}) => {
  if (page < 1 || page > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid page: ${page}`);
  }
  const request = base.createRequest();
  return parseResponse(page, await request.get(`${PATH}/${page === 0 ? '' : page}`));
};

module.exports = dashboard;
