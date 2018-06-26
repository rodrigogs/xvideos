const fresh = require('./best');

const previousFunction = currentPage => () => {
  const previous = currentPage - 1;
  return fresh(previous);
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;

  return previousFunction(page);
};

module.exports = createPreviousFunction;
