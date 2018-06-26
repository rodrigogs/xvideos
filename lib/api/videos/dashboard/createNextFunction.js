const dashboard = require('./dashboard');

const nextFunction = currentPage => () => {
  const next = currentPage + 1;
  return dashboard(next);
};

const createNextFunction = (pagination) => {
  const { page } = pagination;

  return nextFunction(page);
};

module.exports = createNextFunction;
