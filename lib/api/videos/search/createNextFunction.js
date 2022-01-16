const nextFunction = (currentPage) => () => {
  const search = require('./search');
  const next = currentPage + 1;
  return search({ page: next });
};

const createNextFunction = (pagination) => {
  const { page } = pagination;
  return nextFunction(page);
};

module.exports = createNextFunction;
