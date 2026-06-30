import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
declare const StorefrontJwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class StorefrontJwtStrategy extends StorefrontJwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        customerId: string;
        phone: string;
        fullName: string;
        email: string;
    }>;
}
export {};
