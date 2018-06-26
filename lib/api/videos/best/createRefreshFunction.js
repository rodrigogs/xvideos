const fresh = require('./best');

const refreshFunction = currentPage => () => {
  return fresh(currentPage);
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;

  return refreshFunction(page);
};

module.exports = createRefreshFunction;
