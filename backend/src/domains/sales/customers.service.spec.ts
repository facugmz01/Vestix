import { NotFoundException, ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService.update', () => {
  const prisma = {
    customer: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new CustomersService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      type: 'INDIVIDUAL',
      fullName: 'Juan Perez',
      taxId: null,
      email: 'juan@test.com',
      phone: '123',
      creditLimit: 1000,
      usedCredit: 100,
      priceListId: null,
      taxCondition: null,
      isActive: true,
      source: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.customer.findFirst.mockResolvedValue(null);
    prisma.customer.update.mockImplementation(async ({ data }: any) => ({
      id: 'cust-1',
      type: data.type ?? 'INDIVIDUAL',
      fullName: data.fullName ?? 'Juan Perez',
      taxId: data.taxId ?? null,
      email: data.email ?? 'juan@test.com',
      phone: data.phone ?? '123',
      creditLimit: 1000,
      usedCredit: 100,
      priceListId: data.priceListId ?? null,
      taxCondition: data.taxCondition ?? null,
      isActive: data.isActive ?? true,
      source: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  it('updates only whitelisted customer fields (no initialCreditLimit)', async () => {
    const result = await service.update('cust-1', {
      fullName: 'Juan Actualizado',
      email: 'nuevo@test.com',
      phone: '999',
      priceListId: '',
      taxCondition: 'CONSUMIDOR_FINAL',
    });

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: {
        fullName: 'Juan Actualizado',
        email: 'nuevo@test.com',
        phone: '999',
        priceListId: null,
        taxCondition: 'CONSUMIDOR_FINAL',
      },
    });
    expect(result.fullName).toBe('Juan Actualizado');
    expect(result.credit.limit).toBe(1000);
  });

  it('rejects duplicate taxId on update', async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: 'other' });
    await expect(service.update('cust-1', { taxId: '20111111112' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when customer does not exist', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { fullName: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
