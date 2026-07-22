import { StorefrontCustomerIdentityService } from './storefront-customer-identity.service';

describe('StorefrontCustomerIdentityService', () => {
  let service: StorefrontCustomerIdentityService;
  let prisma: any;

  const guest = {
    id: 'guest-1',
    type: 'INDIVIDUAL',
    source: 'STOREFRONT',
    fullName: 'Juan Guest',
    taxId: null,
    taxCondition: null,
    email: 'compra@example.com',
    phone: null,
    creditLimit: 0,
    usedCredit: 0,
    isActive: true,
    priceListId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const session = {
    id: 'session-1',
    type: 'INDIVIDUAL',
    source: 'STOREFRONT',
    fullName: 'Cliente +54911',
    taxId: null,
    taxCondition: null,
    email: null,
    phone: '5491112345678',
    creditLimit: 0,
    usedCredit: 0,
    isActive: true,
    priceListId: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  };

  beforeEach(() => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      saleOrder: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      giftCard: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      loyaltyAccount: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };

    service = new StorefrontCustomerIdentityService(prisma);
  });

  describe('findByIdentifier', () => {
    it('looks up email case-insensitively', async () => {
      prisma.customer.findFirst.mockResolvedValue(guest);
      const found = await service.findByIdentifier({
        type: 'email',
        value: 'Compra@Example.com',
      });
      expect(found).toEqual(guest);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: 'compra@example.com', mode: 'insensitive' } },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('claimRelatedCustomers', () => {
    it('reassigns ecommerce orders from email-matching guest onto session customer', async () => {
      prisma.customer.findMany.mockResolvedValue([guest]);
      prisma.customer.findUniqueOrThrow.mockResolvedValue(session);
      prisma.customer.update.mockImplementation(async ({ where, data }: any) => ({
        ...(where.id === session.id ? session : guest),
        ...data,
        id: where.id,
      }));

      const result = await service.claimRelatedCustomers({
        ...session,
        email: 'compra@example.com',
      });

      expect(prisma.saleOrder.updateMany).toHaveBeenCalledWith({
        where: { customerId: 'guest-1' },
        data: { customerId: 'session-1' },
      });
      expect(result.id).toBe('session-1');
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'guest-1' },
          data: expect.objectContaining({
            isActive: false,
            email: null,
            phone: null,
          }),
        }),
      );
    });

    it('is a no-op when no related customers exist', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      const result = await service.claimRelatedCustomers(guest);
      expect(result).toEqual(guest);
      expect(prisma.saleOrder.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('resolveProfileConflict', () => {
    it('merges storefront guest when profile email collides', async () => {
      prisma.customer.findMany.mockResolvedValue([guest]);
      prisma.customer.findUniqueOrThrow.mockResolvedValue(session);
      prisma.customer.update.mockImplementation(async ({ where, data }: any) => ({
        ...session,
        ...data,
        id: where.id,
      }));

      const result = await service.resolveProfileConflict(session.id, {
        email: 'compra@example.com',
        phone: session.phone,
        taxId: '30111222',
      });

      expect(result?.id).toBe('session-1');
      expect(prisma.saleOrder.updateMany).toHaveBeenCalledWith({
        where: { customerId: 'guest-1' },
        data: { customerId: 'session-1' },
      });
    });

    it('does not auto-merge unrelated ADMIN rows that only share taxId', async () => {
      prisma.customer.findMany.mockResolvedValue([
        {
          ...guest,
          id: 'admin-1',
          source: 'ADMIN',
          email: 'otro@example.com',
          phone: '5491199999999',
          taxId: '30111222',
        },
      ]);

      const result = await service.resolveProfileConflict(session.id, {
        email: 'nuevo@example.com',
        phone: session.phone,
        taxId: '30111222',
      });

      expect(result).toBeNull();
      expect(prisma.saleOrder.updateMany).not.toHaveBeenCalled();
    });
  });
});
