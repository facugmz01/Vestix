import { Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: any, res: Response): Promise<{
        message: string;
        user: {
            id: any;
            email: any;
            roleId: any;
        };
    }>;
    logout(res: Response): Promise<{
        message: string;
    }>;
}
