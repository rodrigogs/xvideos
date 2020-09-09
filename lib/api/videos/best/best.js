const base = require('../../base');
const parseResponse = require('./parseResponse');

const PATH = '/best';

const best = async ({ year, month, page = 1 } = {}) => {
  if (!year) year = new Date().getFullYear();
  year = String(year);
  if (!month) month = new Date().getMonth() + 1; // Date.getMonth is zero based
  month = String(month).padStart(2, '0');

  if (page < 1 || page > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid page: ${page}`);
  }
  const request = base.createRequest();
  return parseResponse(page, await request.get(`${PATH}/${year}-${month}/${page === 0 ? '' : page}`));
};

module.exports = best;
