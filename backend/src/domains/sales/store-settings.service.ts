import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class StoreSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.storeSettings.create({
        data: {
          id: 'default',
        },
      });
    }

    return settings;
  }

  async updateSettings(data: any) {
    return this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        storeName: data.storeName,
        primaryColor: data.primaryColor,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        whatsappNumber: data.whatsappNumber,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
      },
      create: {
        id: 'default',
        storeName: data.storeName,
        primaryColor: data.primaryColor,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        whatsappNumber: data.whatsappNumber,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
      },
    });
  }
}
