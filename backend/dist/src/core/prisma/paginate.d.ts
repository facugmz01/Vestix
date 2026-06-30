export interface PaginationQuery {
    page?: string | number;
    pageSize?: string | number;
    search?: string;
    [key: string]: unknown;
}
export interface PaginateOptions<TWhere = any> {
    searchFields?: string[];
    where?: TWhere;
    orderBy?: any;
    include?: any;
    defaultPageSize?: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}
export declare function paginate<T>(model: {
    findMany: (args: any) => Promise<T[]>;
    count: (args: any) => Promise<number>;
}, query: PaginationQuery, options?: PaginateOptions): Promise<PaginatedResult<T>>;
