const verified = require('./verified');

const previousFunction = currentPage => () => {
  const previous = currentPage - 1;
  return verified(previous);
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;

  return previousFunction(page);
};

module.exports = createPreviousFunction;
