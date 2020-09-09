const nextFunction = (currentPage) => () => {
  const dashboard = require('./dashboard');
  const next = currentPage + 1;
  return dashboard({ page: next });
};

const createNextFunction = (pagination) => {
  const { page } = pagination;
  return nextFunction(page);
};

module.exports = createNextFunction;
