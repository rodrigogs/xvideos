const fresh = require('./best');

const nextFunction = currentPage => () => {
  const next = currentPage + 1;
  return fresh(next);
};

const createNextFunction = (pagination) => {
  const { page } = pagination;

  return nextFunction(page);
};

module.exports = createNextFunction;
