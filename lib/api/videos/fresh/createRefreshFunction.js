const refreshFunction = (currentPage) => () => {
  const fresh = require('./fresh');
  return fresh(currentPage);
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;
  return refreshFunction(page);
};

module.exports = createRefreshFunction;
