const refreshFunction = (currentPage) => () => {
  const search = require('./search');
  return search(currentPage);
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;
  return refreshFunction(page);
};

module.exports = createRefreshFunction;
