const hasNextFunction = (currentPage, pages) => () => {
  return currentPage < Math.max(...pages);
};

const createHasNextFunction = (pagination) => {
  const { page, pages } = pagination;

  return hasNextFunction(page, pages);
};

module.exports = createHasNextFunction;
