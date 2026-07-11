import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ensureCheckoutFixtures, newOrderId } from './fixtures';
import { agent, createTestApp, describeE2e, loginAsAdmin } from './test-helpers';

describeE2e('Checkout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let branchId: string;
  let variantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = new PrismaClient();
    const fixtures = await ensureCheckoutFixtures(prisma);
    branchId = fixtures.branchId;
    variantId = fixtures.variantId;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /api/sales/checkout requires authentication', async () => {
    await agent(app)
      .post('/api/sales/checkout')
      .send({})
      .expect(401);
  });

  it('POST /api/sales/checkout rejects invalid payload after login', async () => {
    const cookie = await loginAsAdmin(app);

    await agent(app)
      .post('/api/sales/checkout')
      .set('Cookie', cookie)
      .send({})
      .expect(400);
  });

  it('POST /api/sales/checkout completes a backoffice smoke sale', async () => {
    const cookie = await loginAsAdmin(app);
    const orderId = newOrderId();
    const unitPrice = 100;

    const res = await agent(app)
      .post('/api/sales/checkout')
      .set('Cookie', cookie)
      .send({
        id: orderId,
        branchId,
        source: 'BACKOFFICE',
        lines: [{ variantId, quantity: 1, unitPriceOverride: unitPrice }],
        paymentMethod: 'CASH',
        posGrandTotal: unitPrice,
        issueInvoice: false,
      })
      .expect(201);

    expect(res.body.status).toBe('SUCCESS');
    expect(res.body.order.id).toBe(orderId);
    expect(res.body.order.grandTotal).toBe(unitPrice);

    const persisted = await prisma.saleOrder.findUnique({ where: { id: orderId } });
    expect(persisted).not.toBeNull();
    expect(persisted?.source).toBe('BACKOFFICE');
  });
});
