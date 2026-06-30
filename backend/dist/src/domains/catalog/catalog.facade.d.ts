import { PrismaService } from '../../core/prisma/prisma.service';
export declare class CatalogFacade {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getVariantWithCombos(variantId: string, tx?: any): Promise<any>;
    getVariantsDetails(variantIds: string[], tx?: any): Promise<any>;
}
