import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CategoriesService, BrandsService } from './taxonomy.service';
import { SettingsService } from '../../../modules/settings/settings.service';
import { PriceHistoryService } from './price-history.service';
import { IdentifiersService } from '../identifiers.service';
import { MediaService } from './media.service';
import { PricingService } from '../pricing.service';

describe('ProductsService - isPublished default behavior', () => {
  let service: ProductsService;

  const prismaMock = {
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    productVariant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    brand: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    stockLevel: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    priceHistory: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    priceList: {
      findUniqueOrThrow: jest.fn(),
    },
    priceListEntry: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((callback) => callback(prismaMock)),
  };

  const categoriesServiceMock = {
    findOne: jest.fn(),
  };

  const brandsServiceMock = {
    findOne: jest.fn(),
  };

  const settingsServiceMock = {
    getPosSettings: jest.fn(),
    getSkuBarcodeSettings: jest.fn(),
  };

  const priceHistoryServiceMock = {
    recordChange: jest.fn(),
  };

  const identifiersServiceMock = {
    generateBaseSku: jest.fn(),
    generateUniqueBarcode: jest.fn(),
    validateSkuUniqueness: jest.fn(),
    validateBarcodeUniqueness: jest.fn(),
    ensureUniqueVariantSku: jest.fn(),
  };

  const mediaServiceMock = {
    persistImageRefs: jest.fn((imgs) => imgs || []),
  };

  const pricingServiceMock = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: BrandsService, useValue: brandsServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: PriceHistoryService, useValue: priceHistoryServiceMock },
        { provide: IdentifiersService, useValue: identifiersServiceMock },
        { provide: MediaService, useValue: mediaServiceMock },
        { provide: PricingService, useValue: pricingServiceMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Default mock returns
    categoriesServiceMock.findOne.mockResolvedValue({ id: 'cat-1', name: 'Ropa' });
    settingsServiceMock.getPosSettings.mockResolvedValue({});
    settingsServiceMock.getSkuBarcodeSettings.mockResolvedValue({ barcodeAutoGenerate: false });
    identifiersServiceMock.generateBaseSku.mockResolvedValue('SKU-100');
    identifiersServiceMock.validateBarcodeUniqueness.mockResolvedValue(true);
    identifiersServiceMock.validateSkuUniqueness.mockResolvedValue(true);
    prismaMock.product.findUnique.mockResolvedValue(null);
  });

  describe('create', () => {
    it('publishes product on web by default (isPublished: true) when isPublished is omitted', async () => {
      const createdProduct = { id: 'prod-1', name: 'Remera Azul', isPublished: true, isActive: true };
      prismaMock.product.create.mockResolvedValue(createdProduct);
      prismaMock.product.findUnique.mockImplementation(({ where }) => {
        if (where?.id) return Promise.resolve(createdProduct);
        return Promise.resolve(null);
      });
      prismaMock.productVariant.create.mockResolvedValue({ id: 'var-1' });

      await service.create({
        name: 'Remera Azul',
        categoryId: 'cat-1',
        basePrice: 1500,
      });

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Remera Azul',
            isPublished: true,
            isActive: true,
          }),
        }),
      );
    });

    it('respects isPublished: false when explicitly set', async () => {
      const createdProduct = { id: 'prod-2', name: 'Remera Borrador', isPublished: false, isActive: true };
      prismaMock.product.create.mockResolvedValue(createdProduct);
      prismaMock.product.findUnique.mockImplementation(({ where }) => {
        if (where?.id) return Promise.resolve(createdProduct);
        return Promise.resolve(null);
      });
      prismaMock.productVariant.create.mockResolvedValue({ id: 'var-2' });

      await service.create({
        name: 'Remera Borrador',
        categoryId: 'cat-1',
        basePrice: 1500,
        isPublished: false,
      });

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Remera Borrador',
            isPublished: false,
          }),
        }),
      );
    });
  });

  describe('bulkImport', () => {
    it('sets isPublished: true by default for imported products', async () => {
      prismaMock.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', code: 'DEP-01' });
      prismaMock.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'General' });
      prismaMock.product.findFirst.mockResolvedValue(null); // Not existing
      prismaMock.product.create.mockResolvedValue({ id: 'prod-imp-1', name: 'Pantalón Negro' });
      prismaMock.productVariant.findUnique.mockResolvedValue(null);
      prismaMock.productVariant.create.mockResolvedValue({ id: 'var-imp-1' });
      prismaMock.stockLevel.findFirst.mockResolvedValue(null);
      prismaMock.stockLevel.create.mockResolvedValue({ id: 'sl-1' });

      await service.bulkImport({
        rows: [
          {
            name: 'Pantalón Negro',
            sku: 'PANT-01',
            basePrice: 5000,
            costPrice: 2000,
          },
        ],
      });

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Pantalón Negro',
            isPublished: true,
            isActive: true,
          }),
        }),
      );
    });

    it('respects isPublished when specified in row data', async () => {
      prismaMock.warehouse.findFirst.mockResolvedValue({ id: 'wh-1', code: 'DEP-01' });
      prismaMock.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'General' });
      prismaMock.product.findFirst.mockResolvedValue(null);
      prismaMock.product.create.mockResolvedValue({ id: 'prod-imp-2', name: 'Pantalón Oculto' });
      prismaMock.productVariant.findUnique.mockResolvedValue(null);
      prismaMock.productVariant.create.mockResolvedValue({ id: 'var-imp-2' });
      prismaMock.stockLevel.findFirst.mockResolvedValue(null);
      prismaMock.stockLevel.create.mockResolvedValue({ id: 'sl-2' });

      await service.bulkImport({
        rows: [
          {
            name: 'Pantalón Oculto',
            sku: 'PANT-02',
            basePrice: 5000,
            isPublished: false,
          },
        ],
      });

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Pantalón Oculto',
            isPublished: false,
          }),
        }),
      );
    });
  });

  describe('Cost Price Immutability', () => {
    it('bulkUpdatePrices updates basePrice but NEVER modifies costPrice', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        {
          id: 'prod-100',
          costPrice: 13000,
          variants: [
            { id: 'var-101', costPrice: 13000, basePrice: 20000 },
            { id: 'var-102', costPrice: 13000, basePrice: 22000 },
          ],
        },
      ]);
      prismaMock.productVariant.update = jest.fn().mockResolvedValue({});
      prismaMock.product.update = jest.fn().mockResolvedValue({});

      await service.bulkUpdatePrices({ percentage: 15 });

      // Must NOT update product costPrice
      expect(prismaMock.product.update).not.toHaveBeenCalled();

      // Must update variant basePrice only, leaving costPrice untouched
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-101' },
        data: { basePrice: 23000 },
      });
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-102' },
        data: { basePrice: 25300 },
      });
    });

    it('updateVariant NEVER modifies costPrice when already set (>0)', async () => {
      prismaMock.productVariant.findUnique.mockResolvedValue({
        id: 'var-200',
        costPrice: 8500,
        basePrice: 15000,
        sku: 'KIMCHI-01',
      });
      prismaMock.productVariant.update = jest.fn().mockResolvedValue({});

      await service.updateVariant('var-200', {
        costPrice: 9999, // Attempted manual overwrite
        basePrice: 17000,
      });

      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-200' },
        data: {
          basePrice: 17000,
        },
      });
    });
  });

  describe('bulkUpdatePrices', () => {
    it('applies category and brand filters including subcategories', async () => {
      prismaMock.category.findMany.mockResolvedValue([{ id: 'sub-cat-1' }]);
      prismaMock.product.findMany.mockResolvedValue([
        {
          id: 'prod-filtered',
          costPrice: 5000,
          variants: [{ id: 'var-1', costPrice: 5000, basePrice: 10000 }],
        },
      ]);
      prismaMock.productVariant.update = jest.fn().mockResolvedValue({});

      const res = await service.bulkUpdatePrices({
        categoryId: 'cat-parent',
        brandId: 'brand-nike',
        percentage: 10,
      });

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: { parentId: 'cat-parent' },
        select: { id: true },
      });
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: { in: ['cat-parent', 'sub-cat-1'] },
          brandId: 'brand-nike',
        },
        include: { variants: { include: undefined } },
      });
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { basePrice: 11000 },
      });
      expect(res.success).toBe(true);
      expect(res.updatedCount).toBe(1);
    });

    it('updates specific fixed price list via priceListEntries upsert', async () => {
      prismaMock.priceList.findUniqueOrThrow.mockResolvedValue({
        id: 'pl-wholesale',
        name: 'Mayorista',
        type: 'BASE',
        isPercentageBased: false,
      });
      prismaMock.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          variants: [
            {
              id: 'var-10',
              basePrice: 10000,
              priceListEntries: [{ overridePrice: 9000 }],
            },
          ],
        },
      ]);
      prismaMock.priceListEntry.upsert = jest.fn().mockResolvedValue({});

      const res = await service.bulkUpdatePrices({
        priceListId: 'pl-wholesale',
        percentage: 20,
      });

      expect(prismaMock.priceListEntry.upsert).toHaveBeenCalledWith({
        where: {
          priceListId_variantId: { priceListId: 'pl-wholesale', variantId: 'var-10' },
        },
        update: { overridePrice: 10800 },
        create: { priceListId: 'pl-wholesale', variantId: 'var-10', overridePrice: 10800 },
      });
      expect(res.target).toBe('Mayorista');
      expect(res.success).toBe(true);
    });

    it('throws BadRequestException if target price list is dynamic MODIFIER', async () => {
      prismaMock.priceList.findUniqueOrThrow.mockResolvedValue({
        id: 'pl-modifier',
        name: 'Efectivo Descuento',
        type: 'MODIFIER',
        isPercentageBased: true,
      });

      await expect(
        service.bulkUpdatePrices({
          priceListId: 'pl-modifier',
          percentage: 10,
        }),
      ).rejects.toThrow('Las listas de precios modificadoras aplican un porcentaje dinámico');
    });
  });
});
