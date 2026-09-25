export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || 20;
  if (limit > 100) limit = 100;
  if (limit < 1) limit = 20;
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sort) {
    const [field, dir] = String(query.sort).split(':');
    if (field) sort = { [field]: dir === 'asc' ? 1 : -1 };
  }

  return { page, limit, skip, sort, search: (query.search || '').trim() };
}

export function paginated(data, total, page, limit) {
  return { data, total, page, limit };
}
