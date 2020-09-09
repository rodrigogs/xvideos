const nextFunction = (currentPage) => () => {
  const verified = require('./verified');
  const next = currentPage + 1;
  return verified({ page: next });
};

const createNextFunction = (pagination) => {
  const { page } = pagination;
  return nextFunction(page);
};

module.exports = createNextFunction;
