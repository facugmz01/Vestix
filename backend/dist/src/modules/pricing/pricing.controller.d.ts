import { PricingService } from './pricing.service';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    findAll(page: string, pageSize: string): Promise<import("./models/price-list.model").PriceList[]>;
    findOne(id: string): Promise<import("./models/price-list.model").PriceList>;
}
