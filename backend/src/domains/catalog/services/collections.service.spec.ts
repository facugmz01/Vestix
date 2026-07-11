import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const prisma = {
    productCollection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productCollectionItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: any) => unknown) => fn(prisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CollectionsService);
  });

  it('creates a collection with products', async () => {
    prisma.productCollection.create.mockResolvedValue({
      id: 'col-1',
      name: 'Verano 2026',
      season: 'SUMMER',
      year: 2026,
      isActive: true,
      products: [],
    });

    const result = await service.create({
      name: 'Verano 2026',
      season: 'SUMMER',
      year: 2026,
      productIds: ['prod-1'],
    });

    expect(result.name).toBe('Verano 2026');
    expect(prisma.productCollection.create).toHaveBeenCalled();
  });

  it('throws when collection not found', async () => {
    prisma.productCollection.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('replaces products on update', async () => {
    prisma.productCollection.findUnique.mockResolvedValue({ id: 'col-1', name: 'Old' });
    prisma.productCollection.update.mockResolvedValue({
      id: 'col-1',
      name: 'Updated',
      products: [],
    });

    await service.update('col-1', { name: 'Updated', productIds: ['prod-2'] });

    expect(prisma.productCollectionItem.deleteMany).toHaveBeenCalledWith({ where: { collectionId: 'col-1' } });
    expect(prisma.productCollectionItem.createMany).toHaveBeenCalled();
  });
});
