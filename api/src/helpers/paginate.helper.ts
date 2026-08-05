export default function paginate<T>({
  page,
  limit,
  total,
  data,
}: PaginateParam<T>): PaginateResult<T> {
  const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

  return { page, limit: limit, total, totalPages, data };
}

export interface PaginateParam<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

export interface PaginateResult<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}
