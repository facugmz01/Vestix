import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RbacService } from '../rbac.service';
export declare class RbacContextMiddleware implements NestMiddleware {
    private rbacService;
    constructor(rbacService: RbacService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
