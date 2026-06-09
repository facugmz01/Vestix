import { PrismaService } from '../../core/prisma/prisma.service';
export declare class StoreSettingsService {
    private prisma;
    constructor(prisma: PrismaService);
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
