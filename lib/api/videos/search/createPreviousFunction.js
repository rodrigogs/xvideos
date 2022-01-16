const previousFunction = (currentPage) => () => {
  const search = require('./search');
  const previous = currentPage - 1;
  return search({ page: previous });
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;
  return previousFunction(page);
};

module.exports = createPreviousFunction;
