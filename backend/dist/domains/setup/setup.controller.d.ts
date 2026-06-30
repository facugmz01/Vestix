import { SetupService } from './setup.service';
export declare class SetupController {
    private readonly setupService;
    constructor(setupService: SetupService);
    getStatus(): Promise<{
        isInitialized: boolean;
    }>;
    createAdmin(body: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    saveCompany(body: {
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
