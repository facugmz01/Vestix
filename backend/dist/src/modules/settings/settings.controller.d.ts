import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Readonly<import("./models/settings.model").SystemSettings>;
    updateSettings(dto: UpdateSettingsDto, req: any): Promise<import("./models/settings.model").SystemSettings>;
    updateOfflineSettings(dto: any, req: any): Promise<import("./models/settings.model").SystemSettings>;
    updateStoreSettings(dto: any, req: any): Promise<import("./models/settings.model").SystemSettings>;
}
