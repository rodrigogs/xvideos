const previousFunction = (currentPage) => () => {
  const verified = require('./verified');
  const previous = currentPage - 1;
  return verified({ page: previous });
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;
  return previousFunction(page);
};

module.exports = createPreviousFunction;
