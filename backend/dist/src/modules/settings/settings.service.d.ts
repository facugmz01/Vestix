import { SystemSettings } from './models/settings.model';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuditService } from '../audit/audit.service';
export declare class SettingsService {
    private readonly auditService;
    private readonly logger;
    private settings;
    constructor(auditService: AuditService);
    getSettings(): Readonly<SystemSettings>;
    updateSettings(dto: UpdateSettingsDto, userId: string): Promise<SystemSettings>;
    getSkuRules(): {
        prefix: string;
        includeCategory: boolean;
        includeBrand: boolean;
        includeColor: boolean;
        includeSize: boolean;
        separator: string;
        uppercased: boolean;
    };
    getBarcodeRules(): {
        companyPrefix: string;
        autoGenerate: boolean;
    };
    getPricingRules(): {
        defaultVatRate: number;
        defaultMarginTarget: number;
        allowNegativeMargin: boolean;
        roundToNearest: number;
        defaultRetailPriceListId: string;
        defaultWholesalePriceListId?: string;
    };
    getInventoryRules(): {
        allowNegativeStock: boolean;
        defaultReorderPoint: number;
        reservationTtlMinutes: number;
    };
    getOfflineRules(): {
        maxOfflineHours: number;
        requireManagerPinForReturns: boolean;
        requireManagerPinForDiscounts: boolean;
    };
}
