import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PriceHistoryService } from './services/price-history.service';
import { SettingsService } from '../../modules/settings/settings.service';
import type { PriceList } from '@prisma/client';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceHistoryService: PriceHistoryService,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll() {
    return this.prisma.priceList.findMany({
      include: { entries: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.priceList.findUniqueOrThrow({
      where: { id },
      include: { entries: true },
    });
  }

  async setVariantPrice(priceListId: string, variantId: string, overridePrice: number, changedBy?: string) {
    const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
    if (list.isPercentageBased) {
      throw new ConflictException('Cannot set explicit variant prices on a percentage-based price list.');
    }

    const existing = await this.prisma.priceListEntry.findUnique({
      where: { priceListId_variantId: { priceListId, variantId } },
    });

    const entry = await this.prisma.priceListEntry.upsert({
      where: {
        priceListId_variantId: { priceListId, variantId },
      },
      update: { overridePrice },
      create: { priceListId, variantId, overridePrice },
    });

    const oldPrice = existing?.overridePrice ?? 0;
    if (!existing || oldPrice !== overridePrice) {
      await this.priceHistoryService.recordChange({
        variantId,
        oldPrice,
        newPrice: overridePrice,
        source: 'PRICE_LIST',
        priceListId,
        changedBy,
      });
    }

    return entry;
  }

  private async findDefaultPriceList(): Promise<PriceList | null> {
    const pricing = await this.settingsService.getPricingSettings();
    if (pricing?.defaultPriceListId) {
      const fromSettings = await this.prisma.priceList.findFirst({
        where: { id: pricing.defaultPriceListId, isActive: true },
      });
      if (fromSettings) return fromSettings;
    }

    return this.prisma.priceList.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }

  private isModifierList(list: Pick<PriceList, 'type' | 'isPercentageBased'>): boolean {
    return list.type === 'MODIFIER' || list.isPercentageBased;
  }

  private getModifierPercentage(list: Pick<PriceList, 'modifierPercentage' | 'percentageDiscount'>): number {
    if (list.modifierPercentage !== null && list.modifierPercentage !== undefined) {
      return list.modifierPercentage;
    }
    return -(list.percentageDiscount || 0);
  }

  private computePriceFromList(
    list: PriceList,
    variant: { basePrice: number; costPrice: number },
    entryOverride?: number | null,
  ): number {
    const referencePrice = variant.basePrice > 0 ? variant.basePrice : variant.costPrice;

    if (this.isModifierList(list)) {
      const multiplier = (100 + this.getModifierPercentage(list)) / 100;
      return Number((referencePrice * multiplier).toFixed(2));
    }

    if (entryOverride != null) return entryOverride;
    return variant.basePrice > 0
      ? variant.basePrice
      : Number((variant.costPrice * list.margin).toFixed(2));
  }

  private isListValidNow(list: Pick<PriceList, 'validFrom' | 'validTo'>, now = new Date()): boolean {
    if (list.validFrom && now < list.validFrom) return false;
    if (list.validTo && now > list.validTo) return false;
    return true;
  }

  async resolvePrice(variantId: string, basePrice: number, customerId?: string): Promise<number> {
    let activePriceList: PriceList | null = null;

    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { priceList: true },
      });
      if (customer?.priceList?.isActive) {
        activePriceList = customer.priceList;
      }
    }

    if (!activePriceList) {
      activePriceList = await this.findDefaultPriceList();
    }

    if (!activePriceList || !this.isListValidNow(activePriceList)) return basePrice;

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { basePrice: true, costPrice: true },
    });
    if (!variant) return basePrice;

    const entry = this.isModifierList(activePriceList)
      ? null
      : await this.prisma.priceListEntry.findUnique({
          where: {
            priceListId_variantId: { priceListId: activePriceList.id, variantId },
          },
        });

    return this.computePriceFromList(activePriceList, variant, entry?.overridePrice);
  }

  async resolvePricesForVariants(
    variantIds: string[],
    priceListId: string,
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (!variantIds.length) return result;

    const [priceList, variants, entries] = await Promise.all([
      this.prisma.priceList.findUnique({ where: { id: priceListId } }),
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, basePrice: true, costPrice: true },
      }),
      this.prisma.priceListEntry.findMany({
        where: { priceListId, variantId: { in: variantIds } },
      }),
    ]);

    const entryMap = new Map(entries.map(e => [e.variantId, e.overridePrice]));
    const now = new Date();

    for (const variant of variants) {
      if (!priceList || !priceList.isActive || !this.isListValidNow(priceList, now)) {
        result.set(variant.id, variant.basePrice);
        continue;
      }

      result.set(
        variant.id,
        this.computePriceFromList(priceList, variant, entryMap.get(variant.id)),
      );
    }

    return result;
  }

  async resolvePriceListPrice(variantId: string, basePrice: number, priceListId: string): Promise<number> {
    const activePriceList = await this.prisma.priceList.findUnique({ where: { id: priceListId } });
    if (!activePriceList || !activePriceList.isActive || !this.isListValidNow(activePriceList)) {
      return basePrice;
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { basePrice: true, costPrice: true },
    });
    if (!variant) return basePrice;

    const entry = this.isModifierList(activePriceList)
      ? null
      : await this.prisma.priceListEntry.findUnique({
          where: {
            priceListId_variantId: { priceListId, variantId },
          },
        });

    return this.computePriceFromList(activePriceList, variant, entry?.overridePrice);
  }

  calculateMargin(sellingPrice: number, weightedAverageCost: number) {
    if (sellingPrice <= 0 || weightedAverageCost <= 0) {
      return { marginPercent: 0, markupPercent: 0, grossProfit: 0 };
    }

    const grossProfit = sellingPrice - weightedAverageCost;
    const marginPercent = (grossProfit / sellingPrice) * 100;
    const markupPercent = (grossProfit / weightedAverageCost) * 100;

    return {
      grossProfit: Number(grossProfit.toFixed(2)),
      marginPercent: Number(marginPercent.toFixed(2)),
      markupPercent: Number(markupPercent.toFixed(2)),
    };
  }

  async bulkUpdateVariantPrices(
    priceListId: string,
    variantsData: { variantId: string; basePrice: number }[],
    modifierPercentage: number,
  ) {
    const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
    if (list.isPercentageBased || list.type === 'MODIFIER') {
      throw new ConflictException('Cannot bulk update explicit prices on a percentage-based price list.');
    }

    const multiplier = (100 + modifierPercentage) / 100;

    const operations = variantsData.map(vData => {
      const newExplicitPrice = Number((vData.basePrice * multiplier).toFixed(2));
      return this.prisma.priceListEntry.upsert({
        where: { priceListId_variantId: { priceListId, variantId: vData.variantId } },
        update: { overridePrice: newExplicitPrice },
        create: { priceListId, variantId: vData.variantId, overridePrice: newExplicitPrice },
      });
    });

    await Promise.all(operations);
    return { success: true, updatedCount: operations.length };
  }

  async applyModifierToBasePrices(
    variants: { id: string; basePrice: number }[],
    modifierPercentage: number,
  ): Promise<{ updatedCount: number }> {
    const multiplier = (100 + modifierPercentage) / 100;
    let updatedCount = 0;

    await this.prisma.$transaction(async tx => {
      for (const variant of variants) {
        const newPrice = Number((variant.basePrice * multiplier).toFixed(2));
        if (newPrice === variant.basePrice) continue;

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { basePrice: newPrice },
        });
        updatedCount++;
      }
    });

    for (const variant of variants) {
      const newPrice = Number((variant.basePrice * multiplier).toFixed(2));
      if (newPrice === variant.basePrice) continue;
      await this.priceHistoryService.recordChange({
        variantId: variant.id,
        oldPrice: variant.basePrice,
        newPrice,
        source: 'BULK',
      });
    }

    return { updatedCount };
  }

  async seedBaseListEntries(priceListId: string): Promise<number> {
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true, basePrice: { gt: 0 } },
      select: { id: true, basePrice: true },
    });

    if (!variants.length) return 0;

    const result = await this.prisma.priceListEntry.createMany({
      data: variants.map(v => ({
        priceListId,
        variantId: v.id,
        overridePrice: v.basePrice,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }
}
