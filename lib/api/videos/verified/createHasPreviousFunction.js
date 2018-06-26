const hasPreviousFunction = (currentPage, pages) => () => {
  return currentPage > Math.min(...pages);
};

const createHasPreviousFunction = (pagination) => {
  const { page, pages } = pagination;

  return hasPreviousFunction(page, pages);
};

module.exports = createHasPreviousFunction;
