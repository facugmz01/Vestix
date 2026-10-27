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
      create: jest.fn(),
      update: jest.fn(),
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
});
