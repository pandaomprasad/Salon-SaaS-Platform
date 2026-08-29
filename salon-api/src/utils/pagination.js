// ================================
// parsePagination Utility
// ================================
// Sanitizes query parameters page & limit to prevent:
//   1. Negative/invalid skip crashes (e.g. ?page=-5, ?page=abc)
//   2. Memory-exhausting heap spikes (e.g. ?limit=1000000)

const parsePagination = (query = {}, defaultLimit = 20, maxLimit = 100) => {
  const pageNum = parseInt(query.page, 10);
  const limitNum = parseInt(query.limit, 10);

  const page = !isNaN(pageNum) && pageNum > 0 ? pageNum : 1;
  const limit = !isNaN(limitNum) && limitNum > 0 ? Math.min(limitNum, maxLimit) : defaultLimit;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = parsePagination;
