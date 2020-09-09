const nextFunction = (currentPage) => () => {
  const best = require('./best');
  const next = currentPage + 1;
  return best({ page: next });
};

const createNextFunction = (pagination) => {
  const { page } = pagination;
  return nextFunction(page);
};

module.exports = createNextFunction;
