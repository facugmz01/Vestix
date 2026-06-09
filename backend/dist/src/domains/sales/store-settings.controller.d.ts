import { StoreSettingsService } from './store-settings.service';
export declare class StoreSettingsController {
    private readonly settingsService;
    constructor(settingsService: StoreSettingsService);
    getSettings(): Promise<{
        id: string;
        storeName: string;
        primaryColor: string;
        heroTitle: string;
        heroSubtitle: string;
        whatsappNumber: string | null;
        instagramUrl: string | null;
        facebookUrl: string | null;
        updatedAt: Date;
    }>;
    updateSettings(data: any): Promise<{
        id: string;
        storeName: string;
        primaryColor: string;
        heroTitle: string;
        heroSubtitle: string;
        whatsappNumber: string | null;
        instagramUrl: string | null;
        facebookUrl: string | null;
        updatedAt: Date;
    }>;
}
