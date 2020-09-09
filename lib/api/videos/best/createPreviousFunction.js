const previousFunction = (currentPage) => () => {
  const best = require('./best');
  const previous = currentPage - 1;
  return best({ page: previous });
};

const createPreviousFunction = (pagination) => {
  const { page } = pagination;
  return previousFunction(page);
};

module.exports = createPreviousFunction;
