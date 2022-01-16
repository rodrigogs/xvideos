const base = require('../../base');
const parseResponse = require('./parseResponse');

const search = async ({ page = 1, k = '' } = {}) => {
  if (page < 1 || page > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid page: ${page}`);
  }
  const request = base.createRequest();

  let query = '?';

  if (page !== 0) {
    query += `p=${page}&`;
  }

  if (k !== '') {
    query += `k=${k}`;
  }

  return parseResponse(page, await request.get(query));
};

module.exports = search;
