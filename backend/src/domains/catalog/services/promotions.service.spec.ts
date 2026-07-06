import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PricingService } from '../pricing.service';
import { PromotionTypeDto } from '../dto/create-promotion.dto';

describe('PromotionsService', () => {
  let service: PromotionsService;

  const prisma = {
    promotionRule: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productVariant: { findMany: jest.fn().mockResolvedValue([]) },
    priceList: { findUniqueOrThrow: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PricingService, useValue: { bulkUpdateVariantPrices: jest.fn() } },
      ],
    }).compile();

    service = module.get(PromotionsService);
  });

  it('maps percentage discount to category rule', async () => {
    prisma.promotionRule.create.mockResolvedValue({
      id: '1',
      name: 'Test',
      type: 'CATEGORY_DISCOUNT',
      isActive: true,
      conditions: { targetCategoryId: 'cat-1', applicableTo: { type: 'CATEGORY', ids: ['cat-1'] } },
      actions: { discountPercentage: 10 },
      validFrom: new Date(),
      validTo: null,
      createdAt: new Date(),
    });

    const result = await service.create({
      name: 'Test',
      type: PromotionTypeDto.PERCENTAGE_DISCOUNT,
      value: 10,
      startDate: '2026-01-01',
      applicableTo: { type: 'CATEGORY', ids: ['cat-1'] },
    });

    expect(result.type).toBe('PERCENTAGE_DISCOUNT');
    expect(prisma.promotionRule.create).toHaveBeenCalled();
  });
});
