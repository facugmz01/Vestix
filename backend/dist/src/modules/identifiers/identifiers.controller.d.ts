import { IdentifiersService } from './identifiers.service';
export declare class IdentifiersController {
    private readonly identifiersService;
    constructor(identifiersService: IdentifiersService);
    generateSku(body: {
        productId?: string;
        attributes?: string[];
    }): Promise<{
        sku: string;
    }>;
    generateBarcode(): Promise<{
        barcode: string;
    }>;
}
