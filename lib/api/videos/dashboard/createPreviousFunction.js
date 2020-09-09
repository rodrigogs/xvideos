const previousFunction = (currentPage) => () => {
  const dashboard = require('./dashboard');
  const previous = currentPage - 1;
  return dashboard({ page: previous });
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;
  return previousFunction(page);
};

module.exports = createPreviousFunction;
