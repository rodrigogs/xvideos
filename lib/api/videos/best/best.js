const base = require('../../base');
const parseResponse = require('./parseResponse');

const PATH = '/best';

const best = async ({ year, month, page = 1 } = {}) => {
  if (!year) year = new Date().getFullYear();
  year = String(year);

  if (!month) month = new Date().getMonth() + 1;
  month = String(month).padStart(2, '0');

  if (page < 1 || page > Number.MAX_VALUE) {
    throw new Error(`Invalid page: ${page}`);
  }

  const request = base.createRequest({
    url: `${PATH}/${year}-${month}/${page === 0 ? '' : page}`,
  });

  return request.get()
    .then(parseResponse(page));
};

module.exports = best;
