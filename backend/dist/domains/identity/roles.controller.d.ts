import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
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
            permissions: {
                id: string;
                action: string;
                subject: string;
                roleId: string;
            }[];
            _count: {
                users: number;
            };
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
