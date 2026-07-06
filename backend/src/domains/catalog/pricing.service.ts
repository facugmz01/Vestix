import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { RulesEngineService } from './rules-engine.service';
import { PriceHistoryService } from './services/price-history.service';

@Injectable()
export class PricingService {
  constructor(
    private readonly rulesEngine: RulesEngineService,
    private readonly prisma: PrismaService,
    private readonly priceHistoryService: PriceHistoryService,
  ) {}

  async findAll() {
    return this.prisma.priceList.findMany({
      include: { entries: true }
    });
  }

  async findOne(id: string) {
    return this.prisma.priceList.findUniqueOrThrow({
      where: { id },
      include: { entries: true }
    });
  }

  async createPriceList(dto: CreatePriceListDto) {
    if (dto.isPercentageBased && !dto.percentageDiscount) {
      throw new ConflictException('Percentage-based lists must provide a percentageDiscount value.');
    }
    
    return this.prisma.priceList.create({
      data: {
        name: dto.name,
        type: dto.type || 'RETAIL',
        currency: dto.currency || 'ARS',
        isPercentageBased: dto.isPercentageBased ?? false,
        percentageDiscount: dto.percentageDiscount,
        validFrom: (dto.validFrom && dto.validFrom.trim() !== '') ? new Date(dto.validFrom) : undefined,
        validTo: (dto.validTo && dto.validTo.trim() !== '') ? new Date(dto.validTo) : undefined,
        isDefault: (dto as any).isDefault ?? false,
      }
    });
  }

  async setVariantPrice(priceListId: string, variantId: string, overridePrice: number, changedBy?: string) {
    const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
    if (list.isPercentageBased) throw new ConflictException('Cannot set explicit variant prices on a percentage-based price list.');

    const existing = await this.prisma.priceListEntry.findUnique({
      where: { priceListId_variantId: { priceListId, variantId } },
    });

    const entry = await this.prisma.priceListEntry.upsert({
      where: {
        priceListId_variantId: { priceListId, variantId }
      },
      update: { overridePrice },
      create: { priceListId, variantId, overridePrice }
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

  async resolvePrice(variantId: string, basePrice: number, customerId?: string): Promise<number> {
    let activePriceList;

    // 1. Try to find customer-specific price list
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { priceList: true }
      });
      if (customer?.priceList) {
        activePriceList = customer.priceList;
      }
    }

    // 2. Fallback to default RETAIL list
    if (!activePriceList) {
      activePriceList = await this.prisma.priceList.findFirst({
        where: { isDefault: true, isActive: true }
      });
    }

    if (!activePriceList) return basePrice;
    
    const now = new Date();
    if (activePriceList.validFrom && now < activePriceList.validFrom) return basePrice;
    if (activePriceList.validTo && now > activePriceList.validTo) return basePrice;

    // Fetch variant details
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { basePrice: true, costPrice: true }
    });
    const vBasePrice = variant?.basePrice ?? basePrice;
    const vCostPrice = variant?.costPrice ?? 0;
    const referencePrice = vBasePrice > 0 ? vBasePrice : vCostPrice;

    if (activePriceList.type === 'MODIFIER' || activePriceList.isPercentageBased) {
      const percentage = (activePriceList.modifierPercentage !== null && activePriceList.modifierPercentage !== undefined)
        ? activePriceList.modifierPercentage
        : -(activePriceList.percentageDiscount || 0);
      const multiplier = (100 + percentage) / 100;
      return Number((referencePrice * multiplier).toFixed(2));
    } else {
      const entry = await this.prisma.priceListEntry.findUnique({
        where: {
          priceListId_variantId: { priceListId: activePriceList.id, variantId }
        }
      });
      if (entry) return entry.overridePrice;

      // Fallback for base list if no entry override
      return vBasePrice > 0 ? vBasePrice : Number((vCostPrice * activePriceList.margin).toFixed(2));
    }
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
      const basePrice = variant.basePrice;
      if (!priceList || !priceList.isActive) {
        result.set(variant.id, basePrice);
        continue;
      }
      if (priceList.validFrom && now < priceList.validFrom) {
        result.set(variant.id, basePrice);
        continue;
      }
      if (priceList.validTo && now > priceList.validTo) {
        result.set(variant.id, basePrice);
        continue;
      }

      const referencePrice = variant.basePrice > 0 ? variant.basePrice : variant.costPrice;

      if (priceList.type === 'MODIFIER' || priceList.isPercentageBased) {
        const percentage =
          priceList.modifierPercentage !== null && priceList.modifierPercentage !== undefined
            ? priceList.modifierPercentage
            : -(priceList.percentageDiscount || 0);
        const multiplier = (100 + percentage) / 100;
        result.set(variant.id, Number((referencePrice * multiplier).toFixed(2)));
      } else {
        const entryPrice = entryMap.get(variant.id);
        if (entryPrice != null) {
          result.set(variant.id, entryPrice);
        } else {
          result.set(
            variant.id,
            variant.basePrice > 0
              ? variant.basePrice
              : Number((variant.costPrice * priceList.margin).toFixed(2)),
          );
        }
      }
    }

    return result;
  }

  async resolvePriceListPrice(variantId: string, basePrice: number, priceListId: string): Promise<number> {
    const activePriceList = await this.prisma.priceList.findUnique({ where: { id: priceListId } });
    if (!activePriceList || !activePriceList.isActive) return basePrice;

    const now = new Date();
    if (activePriceList.validFrom && now < activePriceList.validFrom) return basePrice;
    if (activePriceList.validTo && now > activePriceList.validTo) return basePrice;

    // Fetch variant details
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { basePrice: true, costPrice: true }
    });
    const vBasePrice = variant?.basePrice ?? basePrice;
    const vCostPrice = variant?.costPrice ?? 0;
    const referencePrice = vBasePrice > 0 ? vBasePrice : vCostPrice;

    if (activePriceList.type === 'MODIFIER' || activePriceList.isPercentageBased) {
      const percentage = (activePriceList.modifierPercentage !== null && activePriceList.modifierPercentage !== undefined)
        ? activePriceList.modifierPercentage
        : -(activePriceList.percentageDiscount || 0);
      const multiplier = (100 + percentage) / 100;
      return Number((referencePrice * multiplier).toFixed(2));
    } else {
      const entry = await this.prisma.priceListEntry.findUnique({
        where: {
          priceListId_variantId: { priceListId, variantId }
        }
      });
      if (entry) return entry.overridePrice;

      // Fallback for base list if no entry override
      return vBasePrice > 0 ? vBasePrice : Number((vCostPrice * activePriceList.margin).toFixed(2));
    }
  }

  calculateMargin(sellingPrice: number, weightedAverageCost: number) {
    if (sellingPrice <= 0 || weightedAverageCost <= 0) return { marginPercent: 0, markupPercent: 0, grossProfit: 0 };

    const grossProfit = sellingPrice - weightedAverageCost;
    const marginPercent = (grossProfit / sellingPrice) * 100;
    const markupPercent = (grossProfit / weightedAverageCost) * 100;

    return {
      grossProfit: Number(grossProfit.toFixed(2)),
      marginPercent: Number(marginPercent.toFixed(2)),
      markupPercent: Number(markupPercent.toFixed(2)),
    };
  }

  async bulkUpdateVariantPrices(priceListId: string, variantsData: { variantId: string, basePrice: number }[], modifierPercentage: number) {
    const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
    if (list.isPercentageBased) throw new ConflictException('Cannot bulk update explicit prices on a percentage-based list.');

    const multiplier = (100 + modifierPercentage) / 100;

    const operations = variantsData.map(vData => {
      const newExplicitPrice = Number((vData.basePrice * multiplier).toFixed(2));
      return this.prisma.priceListEntry.upsert({
        where: { priceListId_variantId: { priceListId, variantId: vData.variantId } },
        update: { overridePrice: newExplicitPrice },
        create: { priceListId, variantId: vData.variantId, overridePrice: newExplicitPrice }
      });
    });

    await Promise.all(operations);
    return { success: true, updatedCount: operations.length };
  }
}
