const verified = require('./verified');

const nextFunction = currentPage => () => {
  const next = currentPage + 1;
  return verified(next);
};

const createNextFunction = (pagination) => {
  const { page } = pagination;

  return nextFunction(page);
};

module.exports = createNextFunction;
