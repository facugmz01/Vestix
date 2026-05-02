import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PriceList, PriceListType, PriceListEntry } from './models/price-list.model';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import * as crypto from 'crypto';
import { RulesEngineService } from './rules-engine.service';

@Injectable()
export class PricingService {
  constructor(private readonly rulesEngine: RulesEngineService) {}
  
  private priceLists: PriceList[] = [];
  private entries: PriceListEntry[] = [];
  private customerPriceListAssignments: Map<string, string> = new Map(); 

  async findAll() {
    return this.priceLists;
  }

  async findOne(id: string) {
    const list = this.priceLists.find(pl => pl.id === id);
    if (!list) throw new NotFoundException('Price List not found');
    return list;
  }

  async createPriceList(dto: CreatePriceListDto) {
    if (dto.isPercentageBased && !dto.percentageDiscount) {
      throw new ConflictException('Percentage-based lists must provide a percentageDiscount value.');
    }
    const priceList: PriceList = {
      id: crypto.randomUUID(),
      ...dto,
      isPercentageBased: dto.isPercentageBased ?? false,
      isActive: true,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.priceLists.push(priceList);
    return priceList;
  }

  async setVariantPrice(priceListId: string, variantId: string, overridePrice: number) {
    const list = this.priceLists.find(pl => pl.id === priceListId);
    if (!list) throw new NotFoundException('Price List not found');
    if (list.isPercentageBased) throw new ConflictException('Cannot set explicit variant prices on a percentage-based price list.');

    const existingIdx = this.entries.findIndex(e => e.priceListId === priceListId && e.variantId === variantId);
    
    if (existingIdx >= 0) {
      this.entries[existingIdx].overridePrice = overridePrice;
      this.entries[existingIdx].updatedAt = new Date();
      return this.entries[existingIdx];
    }

    const entry: PriceListEntry = { id: crypto.randomUUID(), priceListId, variantId, overridePrice, updatedAt: new Date() };
    this.entries.push(entry);
    return entry;
  }

  async assignCustomerToPriceList(customerId: string, priceListId: string) {
    this.customerPriceListAssignments.set(customerId, priceListId);
    return { success: true };
  }

  async resolvePrice(variantId: string, basePrice: number, customerId?: string): Promise<number> {
    let activeListId: string | undefined;

    if (customerId && this.customerPriceListAssignments.has(customerId)) activeListId = this.customerPriceListAssignments.get(customerId);
    else {
      const defaultRetail = this.priceLists.find(pl => pl.type === PriceListType.RETAIL && pl.isActive);
      if (defaultRetail) activeListId = defaultRetail.id;
    }

    if (!activeListId) return basePrice;
    const list = this.priceLists.find(pl => pl.id === activeListId);
    if (!list || !list.isActive) return basePrice;
    
    const now = new Date();
    if (list.validFrom && now < list.validFrom) return basePrice;
    if (list.validTo && now > list.validTo) return basePrice;

    if (list.isPercentageBased && list.percentageDiscount) {
      const multiplier = (100 - list.percentageDiscount) / 100;
      return Number((basePrice * multiplier).toFixed(2));
    } else {
      const entry = this.entries.find(e => e.priceListId === activeListId && e.variantId === variantId);
      if (entry) return entry.overridePrice;
    }
    return basePrice;
  }

  // --- NEW CAPABILITIES: PRICING ENGINE ---

  /**
   * Calculates gross margin and markup percentages.
   * Highly critical for managers deciding on promotional discounts.
   * Relies on Weighted Average Cost fetched from the Inventory module.
   */
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

  /**
   * Bulk updates prices for an array of variants.
   * e.g., "Increase all Fall 2024 variants by 5% on the VIP Price List"
   */
  async bulkUpdateVariantPrices(priceListId: string, variantsData: { variantId: string, basePrice: number }[], modifierPercentage: number) {
    const list = this.priceLists.find(pl => pl.id === priceListId);
    if (!list) throw new NotFoundException('Price List not found');
    if (list.isPercentageBased) throw new ConflictException('Cannot bulk update explicit prices on a percentage-based list.');

    // e.g. modifierPercentage = 5 (increase 5%), modifier = -10 (decrease 10%)
    const multiplier = (100 + modifierPercentage) / 100;
    const updatedEntries = [];

    // In production, this executes as a single batched Postgres UPSERT query for performance
    for (const vData of variantsData) {
      const newExplicitPrice = Number((vData.basePrice * multiplier).toFixed(2));
      const existingIdx = this.entries.findIndex(e => e.priceListId === priceListId && e.variantId === vData.variantId);
      
      if (existingIdx >= 0) {
        this.entries[existingIdx].overridePrice = newExplicitPrice;
        this.entries[existingIdx].updatedAt = new Date();
        updatedEntries.push(this.entries[existingIdx]);
      } else {
        const entry: PriceListEntry = { id: crypto.randomUUID(), priceListId, variantId: vData.variantId, overridePrice: newExplicitPrice, updatedAt: new Date() };
        this.entries.push(entry);
        updatedEntries.push(entry);
      }
    }
    return { success: true, updatedCount: updatedEntries.length };
  }
}
