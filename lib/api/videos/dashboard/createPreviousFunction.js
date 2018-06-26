const dashboard = require('./dashboard');

const previousFunction = currentPage => () => {
  const previous = currentPage - 1;
  return dashboard(previous);
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;

  return previousFunction(page);
};

module.exports = createPreviousFunction;
