const refreshFunction = (currentPage) => () => {
  const best = require('./best');
  return best(currentPage);
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;
  return refreshFunction(page);
};

module.exports = createRefreshFunction;
