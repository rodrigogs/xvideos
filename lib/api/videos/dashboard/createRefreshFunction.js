const refreshFunction = (currentPage) => () => {
  const dashboard = require('./dashboard');
  return dashboard(currentPage);
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;
  return refreshFunction(page);
};

module.exports = createRefreshFunction;
