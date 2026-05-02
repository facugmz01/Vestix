import { Response, Request } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: any, res: Response): Promise<{
        id: any;
        email: any;
        role: any;
        permissions: any;
    }>;
    getMe(req: Request): Promise<{
        id: any;
        email: any;
        role: any;
        permissions: any;
    }>;
    logout(res: Response): Promise<{
        message: string;
    }>;
    private transformUser;
}
