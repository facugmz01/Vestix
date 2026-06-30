"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
async function paginate(model, query, options = {}) {
    const { searchFields = [], where: extraWhere = {}, orderBy = { createdAt: 'desc' }, include, defaultPageSize = 50, } = options;
    const page = typeof query.page === 'string' ? parseInt(query.page) || 1 : (query.page || 1);
    const pageSize = typeof query.pageSize === 'string'
        ? parseInt(query.pageSize) || defaultPageSize
        : (query.pageSize || defaultPageSize);
    const skip = (page - 1) * pageSize;
    const where = { ...extraWhere };
    if (query.search && searchFields.length > 0) {
        where.OR = searchFields.map(field => ({
            [field]: { contains: query.search, mode: 'insensitive' },
        }));
    }
    const findArgs = { where, skip, take: pageSize, orderBy };
    if (include)
        findArgs.include = include;
    const [data, total] = await Promise.all([
        model.findMany(findArgs),
        model.count({ where }),
    ]);
    return { data, total, page, pageSize };
}
//# sourceMappingURL=paginate.js.map