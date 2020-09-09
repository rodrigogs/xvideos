const refreshFunction = (currentPage) => () => {
  const verified = require('./verified');
  return verified({ page: currentPage });
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;
  return refreshFunction(page);
};

module.exports = createRefreshFunction;
