import { PrismaService } from '../../core/prisma/prisma.service';
export declare class SetupService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    isSystemInitialized(): Promise<boolean>;
    createSuperAdmin(data: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    saveCompanyInfo(data: {
        companyName: string;
        cuit?: string;
        address?: string;
        phone?: string;
        email?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
