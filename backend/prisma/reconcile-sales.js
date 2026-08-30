const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizePaymentMethodType(raw) {
  if (!raw) return 'CASH';
  const u = String(raw).trim().toUpperCase();
  if (['EFECTIVO', 'CASH', 'CONTADO', 'DINERO'].includes(u)) return 'CASH';
  if (['TRANSFERENCIA', 'TRANSFER', 'BANK_TRANSFER', 'DEPOSITO', 'DEPOSIT', 'BANCO'].includes(u)) return 'BANK_TRANSFER';
  if (['TARJETA', 'DEBIT_CARD', 'CREDIT_CARD', 'CARD', 'QR_MERCADOPAGO', 'MERCADOPAGO', 'MP', 'MERCADO_PAGO'].includes(u)) return 'CREDIT_CARD';
  if (['CUENTA_CORRIENTE', 'CUSTOMER_CREDIT', 'STORE_CREDIT', 'CREDITO', 'CREDIT'].includes(u)) return 'CUSTOMER_CREDIT';
  if (u === 'GIFT_CARD') return 'GIFT_CARD';
  if (u === 'LOYALTY') return 'LOYALTY';
  return u;
}

async function resolvePaymentAccount(
  tx,
  branchId,
  methodType,
  cashShiftId,
  explicitAccountId
) {
  if (explicitAccountId) {
    const explicit = await tx.financialAccount.findUnique({
      where: { id: explicitAccountId },
    });
    if (explicit && explicit.isActive) return explicit.id;
  }

  if (cashShiftId) {
    const shift = await tx.cashShift.findUnique({
      where: { id: cashShiftId },
      include: {
        cashRegister: {
          include: {
            paymentMethods: {
              where: { isActive: true },
              include: { account: true },
            },
          },
        },
      },
    });

    if (shift && shift.cashRegister) {
      const registerPm = shift.cashRegister.paymentMethods.find(
        (p) => p.type === methodType && p.accountId
      );
      if (registerPm && registerPm.accountId) return registerPm.accountId;

      if (methodType === 'CASH') {
        const branchCashAccount = await tx.financialAccount.findFirst({
          where: { branchId: shift.cashRegister.branchId || branchId, type: 'CASH', isActive: true },
        });
        if (branchCashAccount) return branchCashAccount.id;
      }
    }
  }

  const pm = await tx.paymentMethod.findFirst({
    where: { type: methodType, isActive: true, accountId: { not: null } },
    include: { account: true },
  });
  if (pm && pm.accountId && pm.account && pm.account.isActive) {
    return pm.accountId;
  }

  const targetType = methodType === 'CASH' ? 'CASH' : 'BANK';
  let account = await tx.financialAccount.findFirst({
    where: { branchId, type: targetType, isActive: true },
  });

  if (!account) {
    account = await tx.financialAccount.findFirst({
      where: { type: targetType, isActive: true },
    });
  }

  if (!account) {
    account = await tx.financialAccount.findFirst({
      where: { branchId, isActive: true },
    });
  }

  if (!account) {
    account = await tx.financialAccount.findFirst({
      where: { isActive: true },
    });
  }

  if (!account) {
    account = await tx.financialAccount.create({
      data: {
        name: targetType === 'CASH' ? 'Caja Principal (Efectivo)' : 'Banco / Cobros Digitales',
        type: targetType,
        currency: 'ARS',
        branchId: branchId || null,
        balance: 0,
        isActive: true,
      },
    });
  }

  return account.id;
}

async function main() {
  console.log('=== VESTIX ERP: RECONCILIACION DE VENTAS HUERFANAS ===');

  const orders = await prisma.saleOrder.findMany({
    where: {
      status: { in: ['COMPLETED', 'CONFIRMED'] },
    },
    include: {
      payments: { include: { paymentMethod: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Total de ventas analizadas: ' + orders.length);

  let reconciledCount = 0;
  let skippedCount = 0;
  let totalAmountReconciled = 0;
  const accountDeltas = {};

  for (const order of orders) {
    const existingTxCount = await prisma.financialTransaction.count({
      where: { referenceId: order.id, type: 'DEBIT' },
    });

    if (existingTxCount > 0) {
      skippedCount++;
      continue;
    }

    const normOrderMethod = normalizePaymentMethodType(order.paymentMethod);

    if (normOrderMethod === 'CUSTOMER_CREDIT' && order.customerId) {
      const ccMovement = await prisma.currentAccountMovement.findFirst({
        where: { referenceId: order.id },
      });
      if (!ccMovement) {
        await prisma.$transaction(async (tx) => {
          const customer = await tx.customer.findUnique({ where: { id: order.customerId } });
          if (customer) {
            const prevBalance = customer.currentAccountBalance || 0;
            const newBalance = prevBalance + order.grandTotal;
            await tx.customer.update({
              where: { id: customer.id },
              data: { currentAccountBalance: newBalance },
            });
            await tx.currentAccountMovement.create({
              data: {
                accountId: customer.id,
                entityType: 'CUSTOMER',
                documentType: 'DEBIT_NOTE',
                referenceId: order.id,
                description: 'Reconciliacion: Cargo Venta #' + order.id.slice(0, 8),
                amount: order.grandTotal,
                debit: order.grandTotal,
                credit: 0,
                balanceAfter: newBalance,
                createdAt: order.createdAt,
              },
            });
          }
        });
        reconciledCount++;
        totalAmountReconciled += order.grandTotal;
        console.log('[CC RECONCILED] Venta ' + order.id + ' ($' + order.grandTotal + ') cargada a cliente ' + order.customerId);
      } else {
        skippedCount++;
      }
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const paymentSlices = [];

      if (order.payments && order.payments.length > 0) {
        for (const p of order.payments) {
          paymentSlices.push({
            method: normalizePaymentMethodType(p.paymentMethod ? p.paymentMethod.type : order.paymentMethod),
            amount: p.amount,
            reference: p.referenceId || undefined,
          });
        }
      } else {
        paymentSlices.push({
          method: normOrderMethod,
          amount: order.grandTotal,
        });
      }

      let primaryAccountId = null;

      for (const slice of paymentSlices) {
        if (slice.amount <= 0.01) continue;
        if (slice.method === 'CUSTOMER_CREDIT') continue;

        const accountId = await resolvePaymentAccount(
          tx,
          order.branchId,
          slice.method,
          order.cashShiftId,
          order.paymentAccountId
        );

        if (!primaryAccountId) primaryAccountId = accountId;

        const desc = 'Cobro Venta #' + order.id.slice(0, 8) + ' via ' + slice.method + (slice.reference ? ' Ref: ' + slice.reference : '') + ' (Reconciliado)';

        await tx.financialTransaction.create({
          data: {
            accountId,
            type: 'DEBIT',
            amount: slice.amount,
            referenceId: order.id,
            description: desc,
            createdAt: order.createdAt,
          },
        });

        const acc = await tx.financialAccount.update({
          where: { id: accountId },
          data: { balance: { increment: slice.amount } },
        });

        if (!accountDeltas[accountId]) {
          accountDeltas[accountId] = { name: acc.name, amount: 0 };
        }
        accountDeltas[accountId].amount += slice.amount;

        await tx.treasuryReceipt.create({
          data: {
            accountId,
            amount: slice.amount,
            payerName: order.customerId || 'Walk-in',
            referenceId: order.id,
            description: desc,
            createdAt: order.createdAt,
          },
        });

        totalAmountReconciled += slice.amount;
      }

      if (primaryAccountId && !order.financialAccountId) {
        await tx.saleOrder.update({
          where: { id: order.id },
          data: { financialAccountId: primaryAccountId },
        });
      }
    });

    reconciledCount++;
    console.log('[SALE RECONCILED] Venta ' + order.id + ' ($' + order.grandTotal + ') asentada en libro mayor.');
  }

  console.log('\n=== RESULTADOS DE LA RECONCILIACION ===');
  console.log('Ventas reconciliadas exitosamente: ' + reconciledCount);
  console.log('Ventas omitidas (ya procesadas): ' + skippedCount);
  console.log('Monto total reconciliado: $' + totalAmountReconciled.toLocaleString('es-AR'));
  console.log('Impacto por cuenta financiera:');
  for (const [id, info] of Object.entries(accountDeltas)) {
    console.log(' - Cuenta "' + info.name + '" (' + id + '): +$' + info.amount.toLocaleString('es-AR'));
  }
}

main()
  .catch((e) => {
    console.error('Error durante la reconciliacion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
