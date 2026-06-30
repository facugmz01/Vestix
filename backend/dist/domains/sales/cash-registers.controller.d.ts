import { PrismaService } from '../../core/prisma/prisma.service';
declare class CreateCashRegisterDto {
    name: string;
    code?: string;
    branchId: string;
    isActive?: boolean;
}
export declare class CashRegistersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCashRegisterDto): Promise<{
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string;
        branchId: string;
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query: any): Promise<{
        data: ({
            branch: {
                id: string;
                name: string;
                code: string;
                address: string | null;
                phone: string | null;
                isMain: boolean;
                isActive: boolean;
                settings: import(".prisma/client").Prisma.JsonValue | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            code: string;
            branchId: string;
            status: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__CashRegisterClient<{
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string;
        branchId: string;
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, dto: Partial<CreateCashRegisterDto>): import(".prisma/client").Prisma.Prisma__CashRegisterClient<{
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string;
        branchId: string;
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__CashRegisterClient<{
        id: string;
        name: string;
        code: string;
        branchId: string;
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
export {};
