/**
 * Shared pagination helper for Prisma queries.
 * Replaces the duplicated findAll boilerplate across 10+ service files
 * (customers, suppliers, branches, warehouses, transfers, purchasing, etc.)
 *
 * Usage:
 *   const result = await paginate(this.prisma.customer, query, {
 *     searchFields: ['fullName', 'email', 'taxId'],
 *     orderBy: { fullName: 'asc' },
 *     include: { orders: true },
 *   });
 */

export interface PaginationQuery {
  page?: string | number;
  pageSize?: string | number;
  search?: string;
  [key: string]: unknown;
}

export interface PaginateOptions<TWhere = any> {
  /** Fields to apply case-insensitive `contains` search against */
  searchFields?: string[];
  /** Additional where conditions (merged with search) */
  where?: TWhere;
  /** Prisma orderBy clause */
  orderBy?: any;
  /** Prisma include clause */
  include?: any;
  /** Default page size if not provided in query (default: 50) */
  defaultPageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Executes a paginated findMany + count query on the given Prisma model delegate.
 */
export async function paginate<T>(
  model: { findMany: (args: any) => Promise<T[]>; count: (args: any) => Promise<number> },
  query: PaginationQuery,
  options: PaginateOptions = {},
): Promise<PaginatedResult<T>> {
  const {
    searchFields = [],
    where: extraWhere = {},
    orderBy = { createdAt: 'desc' },
    include,
    defaultPageSize = 50,
  } = options;

  const page = typeof query.page === 'string' ? parseInt(query.page) || 1 : (query.page || 1);
  const pageSize = typeof query.pageSize === 'string'
    ? parseInt(query.pageSize) || defaultPageSize
    : (query.pageSize || defaultPageSize);
  const skip = (page - 1) * pageSize;

  // Build search condition
  const where: any = { ...extraWhere };
  if (query.search && searchFields.length > 0) {
    where.OR = searchFields.map(field => ({
      [field]: { contains: query.search, mode: 'insensitive' },
    }));
  }

  const findArgs: any = { where, skip, take: pageSize, orderBy };
  if (include) findArgs.include = include;

  const [data, total] = await Promise.all([
    model.findMany(findArgs),
    model.count({ where }),
  ]);

  return { data, total, page, pageSize };
}
