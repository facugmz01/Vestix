import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SettingsService, LoyaltySettings } from '../../../modules/settings/settings.service';

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerAmount: 1,
  amountUnit: 100,
  redeemValuePerPoint: 1,
};

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async getSettings(): Promise<LoyaltySettings> {
    return this.settingsService.getLoyaltySettings();
  }

  async getOrCreateAccount(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    return this.prisma.loyaltyAccount.upsert({
      where: { customerId },
      create: { customerId, points: 0, tier: 'STANDARD' },
      update: {},
    });
  }

  async getAccount(customerId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (!account) throw new NotFoundException('Cuenta de fidelización no encontrada');
    return account;
  }

  calculateEarnedPoints(grandTotal: number, settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS): number {
    if (!settings.enabled || settings.amountUnit <= 0) return 0;
    return Math.floor(grandTotal / settings.amountUnit) * settings.pointsPerAmount;
  }

  async earnPointsForOrder(customerId: string, grandTotal: number, orderId?: string) {
    const settings = await this.getSettings();
    if (!settings.enabled) return null;

    const earned = this.calculateEarnedPoints(grandTotal, settings);
    if (earned <= 0) return null;

    const account = await this.getOrCreateAccount(customerId);
    const updated = await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: { increment: earned } },
    });

    return { account: updated, earned, orderId: orderId ?? null };
  }

  async redeemPoints(customerId: string, points: number, reason?: string) {
    if (points <= 0) throw new BadRequestException('Los puntos a canjear deben ser mayores a cero');

    const settings = await this.getSettings();
    if (!settings.enabled) throw new BadRequestException('Programa de fidelización deshabilitado');

    const account = await this.getOrCreateAccount(customerId);
    if (account.points < points) {
      throw new BadRequestException('Puntos insuficientes');
    }

    const updated = await this.prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: { decrement: points } },
    });

    const redeemValue = points * settings.redeemValuePerPoint;
    return {
      account: updated,
      redeemedPoints: points,
      redeemValue,
      reason: reason ?? null,
    };
  }

  async adjustAccount(customerId: string, points: number, tier?: string) {
    await this.getOrCreateAccount(customerId);
    return this.prisma.loyaltyAccount.update({
      where: { customerId },
      data: {
        points,
        ...(tier !== undefined ? { tier } : {}),
      },
    });
  }
}
