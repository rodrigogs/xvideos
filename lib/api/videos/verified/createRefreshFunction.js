const verified = require('./verified');

const refreshFunction = currentPage => () => {
  return verified({ page: currentPage });
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;

  return refreshFunction(page);
};

module.exports = createRefreshFunction;
