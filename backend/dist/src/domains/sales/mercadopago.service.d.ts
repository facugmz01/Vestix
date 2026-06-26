import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
export interface MercadoPagoPreferenceItem {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
}
export interface CreatePreferenceDto {
    externalReference: string;
    items: MercadoPagoPreferenceItem[];
    payer?: {
        name?: string;
        email?: string;
        phone?: {
            area_code?: string;
            number?: string;
        };
    };
    shippingCost?: number;
    backUrls?: {
        success?: string;
        failure?: string;
        pending?: string;
    };
}
export interface MercadoPagoPreference {
    id: string;
    init_point: string;
    sandbox_init_point: string;
}
export declare class MercadoPagoService {
    private readonly prisma;
    private readonly settingsService;
    private readonly logger;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    private getAccessToken;
    createPreference(dto: CreatePreferenceDto): Promise<{
        initPoint: string;
        preferenceId: string;
    }>;
}
