import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<any>;
    updateGeneral(dto: any, req: any): Promise<any>;
    updatePricing(dto: any, req: any): Promise<any>;
    updateSkuBarcode(dto: any, req: any): Promise<any>;
    updateInvoicing(dto: any, req: any): Promise<any>;
    updateNotifications(dto: any, req: any): Promise<any>;
    updateIntegrations(dto: any, req: any): Promise<any>;
    updateOffline(dto: any, req: any): Promise<any>;
}
