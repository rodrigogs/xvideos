const dashboard = require('./dashboard');

const refreshFunction = currentPage => () => {
  return dashboard(currentPage);
};

const createRefreshFunction = (pagination) => {
  const { page } = pagination;

  return refreshFunction(page);
};

module.exports = createRefreshFunction;
