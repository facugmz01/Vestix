import { PrismaService } from '../../core/prisma/prisma.service';
export interface CreateRoleDto {
    name: string;
    permissions: {
        action: string;
        subject: string;
    }[];
}
export interface UpdateRoleDto {
    name?: string;
    permissions?: {
        action: string;
        subject: string;
    }[];
}
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createRoleDto: CreateRoleDto): Promise<{
        permissions: {
            id: string;
            action: string;
            subject: string;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
    }>;
    findAll(): Promise<{
        data: ({
            _count: {
                users: number;
            };
            permissions: {
                id: string;
                action: string;
                subject: string;
                roleId: string;
            }[];
        } & {
            id: string;
            name: string;
        })[];
        total: number;
    }>;
    findOne(id: string): Promise<{
        permissions: {
            id: string;
            action: string;
            subject: string;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        permissions: {
            id: string;
            action: string;
            subject: string;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
