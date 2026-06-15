import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { RulesEngineService } from './rules-engine.service';

@Injectable()
export class PricingService {
  constructor(
    private readonly rulesEngine: RulesEngineService,
    private readonly prisma: PrismaService
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

  async setVariantPrice(priceListId: string, variantId: string, overridePrice: number) {
    const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
    if (list.isPercentageBased) throw new ConflictException('Cannot set explicit variant prices on a percentage-based price list.');

    return this.prisma.priceListEntry.upsert({
      where: {
        priceListId_variantId: { priceListId, variantId }
      },
      update: { overridePrice },
      create: { priceListId, variantId, overridePrice }
    });
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

    if (activePriceList.isPercentageBased && activePriceList.percentageDiscount) {
      const multiplier = (100 - activePriceList.percentageDiscount) / 100;
      return Number((basePrice * multiplier).toFixed(2));
    } else {
      const entry = await this.prisma.priceListEntry.findUnique({
        where: {
          priceListId_variantId: { priceListId: activePriceList.id, variantId }
        }
      });
      if (entry) return entry.overridePrice;
    }
    return basePrice;
  }

  async resolvePriceListPrice(variantId: string, basePrice: number, priceListId: string): Promise<number> {
    const activePriceList = await this.prisma.priceList.findUnique({ where: { id: priceListId } });
    if (!activePriceList || !activePriceList.isActive) return basePrice;

    const now = new Date();
    if (activePriceList.validFrom && now < activePriceList.validFrom) return basePrice;
    if (activePriceList.validTo && now > activePriceList.validTo) return basePrice;

    if (activePriceList.isPercentageBased && activePriceList.percentageDiscount) {
      const multiplier = (100 - activePriceList.percentageDiscount) / 100;
      return Number((basePrice * multiplier).toFixed(2));
    } else {
      const entry = await this.prisma.priceListEntry.findUnique({
        where: {
          priceListId_variantId: { priceListId, variantId }
        }
      });
      if (entry) return entry.overridePrice;
    }
    return basePrice;
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
