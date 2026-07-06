import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto, PromotionTypeDto } from '../dto/create-promotion.dto';
import { PricingService } from '../pricing.service';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  private toDbShape(dto: CreatePromotionDto | UpdatePromotionDto) {
    const applicableTo = dto.applicableTo || { type: 'ALL', ids: [] };
    const value = dto.value ?? 0;
    let type = dto.type || PromotionTypeDto.PERCENTAGE_DISCOUNT;
    let conditions: Record<string, any> = {};
    let actions: Record<string, any> = {};

    if (type === PromotionTypeDto.PERCENTAGE_DISCOUNT) {
      if (applicableTo.type === 'CATEGORY' && applicableTo.ids?.length) {
        type = PromotionTypeDto.CATEGORY_DISCOUNT;
        conditions = { targetCategoryId: applicableTo.ids[0] };
        actions = { discountPercentage: value };
      } else {
        conditions = { minimumSpend: 0 };
        actions = { discountPercentage: value, scope: applicableTo.type, targetIds: applicableTo.ids || [] };
      }
    } else if (type === PromotionTypeDto.FIXED_DISCOUNT) {
      type = PromotionTypeDto.CART_TOTAL_DISCOUNT;
      conditions = { minimumSpend: 0 };
      actions = { flatDiscountAmount: value };
    } else if (type === PromotionTypeDto.BOGO) {
      conditions = {
        requiredQuantity: Math.max(1, Math.floor(value) || 1),
        targetVariantId: applicableTo.ids?.[0],
      };
      actions = { freeQuantity: 1 };
    } else if (type === PromotionTypeDto.BULK_DISCOUNT) {
      conditions = { minimumQuantity: Math.max(2, Math.floor(value) || 2), scope: applicableTo.type, targetIds: applicableTo.ids || [] };
      actions = { discountPercentage: value };
    } else if (type === PromotionTypeDto.CATEGORY_DISCOUNT) {
      conditions = { targetCategoryId: applicableTo.ids?.[0] };
      actions = { discountPercentage: value };
    } else if (type === PromotionTypeDto.CART_TOTAL_DISCOUNT) {
      conditions = { minimumSpend: value };
      actions = { flatDiscountAmount: value };
    }

    return {
      type,
      conditions: { ...conditions, description: (dto as CreatePromotionDto).description, applicableTo },
      actions,
      validFrom: dto.startDate ? new Date(dto.startDate) : undefined,
      validTo: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive ?? true,
    };
  }

  private toFrontendShape(rule: any) {
    const conditions = (rule.conditions || {}) as Record<string, any>;
    const actions = (rule.actions || {}) as Record<string, any>;
    const applicableTo = conditions.applicableTo || { type: 'ALL', ids: [] };

    let type: PromotionTypeDto = rule.type;
    let value = 0;

    if (rule.type === PromotionTypeDto.CATEGORY_DISCOUNT) {
      type = PromotionTypeDto.PERCENTAGE_DISCOUNT;
      value = actions.discountPercentage ?? 0;
    } else if (rule.type === PromotionTypeDto.CART_TOTAL_DISCOUNT) {
      type = actions.discountPercentage != null ? PromotionTypeDto.PERCENTAGE_DISCOUNT : PromotionTypeDto.FIXED_DISCOUNT;
      value = actions.flatDiscountAmount ?? actions.discountPercentage ?? conditions.minimumSpend ?? 0;
    } else if (rule.type === PromotionTypeDto.BOGO) {
      type = PromotionTypeDto.BOGO;
      value = conditions.requiredQuantity ?? 1;
    } else if (rule.type === PromotionTypeDto.BULK_DISCOUNT) {
      type = PromotionTypeDto.BULK_DISCOUNT;
      value = conditions.minimumQuantity ?? actions.discountPercentage ?? 0;
    } else if (actions.discountPercentage != null) {
      value = actions.discountPercentage;
    }

    return {
      id: rule.id,
      name: rule.name,
      description: conditions.description,
      type,
      value,
      startDate: rule.validFrom?.toISOString() || rule.createdAt?.toISOString(),
      endDate: rule.validTo?.toISOString(),
      isActive: rule.isActive,
      applicableTo,
      createdAt: rule.createdAt?.toISOString(),
    };
  }

  async findAll(query: { page?: string; pageSize?: string; search?: string; isActive?: string; type?: string }) {
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '15', 10);
    const where: any = {};
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.promotionRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotionRule.count({ where }),
    ]);

    return { data: data.map(r => this.toFrontendShape(r)), total, page, pageSize };
  }

  async findOne(id: string) {
    const rule = await this.prisma.promotionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException(`Promoción ${id} no encontrada`);
    return this.toFrontendShape(rule);
  }

  async create(dto: CreatePromotionDto) {
    const mapped = this.toDbShape(dto);
    const rule = await this.prisma.promotionRule.create({
      data: {
        name: dto.name,
        type: mapped.type,
        isActive: mapped.isActive,
        conditions: mapped.conditions,
        actions: mapped.actions,
        validFrom: mapped.validFrom,
        validTo: mapped.validTo,
      },
    });
    return this.toFrontendShape(rule);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.findOne(id);
    const mapped = this.toDbShape(dto as CreatePromotionDto);
    const rule = await this.prisma.promotionRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.type !== undefined ? { type: mapped.type } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.startDate !== undefined ? { validFrom: mapped.validFrom } : {}),
        ...(dto.endDate !== undefined ? { validTo: mapped.validTo } : {}),
        conditions: mapped.conditions,
        actions: mapped.actions,
      },
    });
    return this.toFrontendShape(rule);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.promotionRule.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  async getConflicts() {
    const rules = await this.prisma.promotionRule.findMany({ where: { isActive: true } });
    const conflicts: Array<{ promoIdA: string; promoIdB: string; description: string }> = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const a = rules[i];
        const b = rules[j];
        const overlap = this.datesOverlap(a.validFrom, a.validTo, b.validFrom, b.validTo);
        if (!overlap) continue;

        const aCond = a.conditions as any;
        const bCond = b.conditions as any;
        const sameTarget =
          a.type === b.type &&
          (aCond?.targetCategoryId === bCond?.targetCategoryId ||
            aCond?.targetVariantId === bCond?.targetVariantId ||
            (aCond?.applicableTo?.type === 'ALL' && bCond?.applicableTo?.type === 'ALL'));

        if (sameTarget) {
          conflicts.push({
            promoIdA: a.id,
            promoIdB: b.id,
            description: `"${a.name}" y "${b.name}" se solapan en fechas y alcance`,
          });
        }
      }
    }
    return conflicts;
  }

  async getImpactPreview(id: string) {
    const promo = await this.findOne(id);
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: true },
      take: 200,
    });

    let affected = variants;
    if (promo.applicableTo?.type === 'CATEGORY' && promo.applicableTo.ids?.length) {
      affected = variants.filter(v => promo.applicableTo!.ids!.includes(v.product.categoryId));
    } else if (promo.applicableTo?.type === 'PRODUCT' && promo.applicableTo.ids?.length) {
      affected = variants.filter(v => promo.applicableTo!.ids!.includes(v.productId));
    }

    const sampleVariants = affected.slice(0, 5).map(v => {
      const discount = promo.type === 'FIXED_DISCOUNT' ? promo.value : (v.basePrice * promo.value) / 100;
      const discountedPrice = Math.max(0, v.basePrice - discount);
      return { sku: v.sku, originalPrice: v.basePrice, discountedPrice: Number(discountedPrice.toFixed(2)) };
    });

    const avgDiscount = sampleVariants.length
      ? sampleVariants.reduce((s, v) => s + ((v.originalPrice - v.discountedPrice) / v.originalPrice) * 100, 0) / sampleVariants.length
      : 0;

    return {
      affectedVariantsCount: affected.length,
      averageDiscountPercentage: Number(avgDiscount.toFixed(2)),
      sampleVariants,
    };
  }

  async executeBulkUpdate(dto: { promotionId?: string; priceListId?: string; action: string }) {
    if (dto.action === 'APPLY_PRICE_LIST_MODIFIER' && dto.priceListId) {
      const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: dto.priceListId } });
      const variants = await this.prisma.productVariant.findMany({ where: { isActive: true } });
      const pct = list.modifierPercentage ?? -(list.percentageDiscount || 0);
      await this.pricingService.bulkUpdateVariantPrices(
        dto.priceListId,
        variants.map(v => ({ variantId: v.id, basePrice: v.basePrice })),
        pct,
      );
      return { updatedCount: variants.length };
    }

    if (dto.action === 'FLATTEN_PRICES') {
      const res = await this.prisma.productVariant.updateMany({
        where: { isActive: true },
        data: { basePrice: 0 },
      });
      return { updatedCount: res.count };
    }

    return { updatedCount: 0, message: 'APPLY_PROMO requires manual price review in v1' };
  }

  private datesOverlap(aFrom?: Date | null, aTo?: Date | null, bFrom?: Date | null, bTo?: Date | null): boolean {
    const startA = aFrom || new Date(0);
    const endA = aTo || new Date('2099-12-31');
    const startB = bFrom || new Date(0);
    const endB = bTo || new Date('2099-12-31');
    return startA <= endB && startB <= endA;
  }
}
