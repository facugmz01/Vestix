import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

const mockCatalogService: any = {
  createProduct: jest.fn(),
  addVariantToProduct: jest.fn(),
  addBarcodeToVariant: jest.fn(),
  findAllForPos: jest.fn(),
};

describe('CatalogController', () => {
  let controller: CatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: mockCatalogService }],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProduct', () => {
    it('should delegate to catalogService.createProduct', () => {
      const dto = { name: 'T-Shirt', categoryId: 'c1' };
      mockCatalogService.createProduct.mockReturnValue({ id: 'p1', ...dto });
      const result = controller.createProduct(dto as any);
      expect(mockCatalogService.createProduct).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'p1', ...dto });
    });
  });

  describe('addVariant', () => {
    it('should delegate to catalogService.addVariantToProduct', () => {
      const dto = { sku: 'SKU-1', basePrice: 100 };
      mockCatalogService.addVariantToProduct.mockReturnValue({ id: 'v1' });
      const result = controller.addVariant('p1', dto as any);
      expect(mockCatalogService.addVariantToProduct).toHaveBeenCalledWith('p1', dto);
      expect(result).toEqual({ id: 'v1' });
    });
  });

  describe('addBarcode', () => {
    it('should delegate to catalogService.addBarcodeToVariant', () => {
      const dto = { barcode: '123456' };
      mockCatalogService.addBarcodeToVariant.mockReturnValue({ id: 'b1' });
      const result = controller.addBarcode('v1', dto as any);
      expect(mockCatalogService.addBarcodeToVariant).toHaveBeenCalledWith('v1', dto);
      expect(result).toEqual({ id: 'b1' });
    });
  });

  describe('getPosSyncData', () => {
    it('should delegate to catalogService.findAllForPos', () => {
      mockCatalogService.findAllForPos.mockReturnValue([]);
      const result = controller.getPosSyncData();
      expect(mockCatalogService.findAllForPos).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
