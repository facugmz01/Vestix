const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const [debitCount, accounts, ordersCount, txCount, receiptsCount] = await Promise.all([
    p.financialTransaction.count({where:{type:'DEBIT'}}),
    p.financialAccount.findMany({select:{name:true,balance:true,type:true}}),
    p.saleOrder.count({where:{status:{in:['COMPLETED','CONFIRMED']}}}),
    p.financialTransaction.count(),
    p.treasuryReceipt.count(),
  ]);
  console.log('=== ESTADO FINANCIERO DESPUÉS DE LA RECONCILIACIÓN ===');
  console.log('Ventas completadas: ' + ordersCount);
  console.log('Transacciones DEBIT: ' + debitCount);
  console.log('Total transacciones: ' + txCount);
  console.log('Recibos de tesorería: ' + receiptsCount);
  console.log('Cuentas:');
  for (const a of accounts) {
    console.log('  - [' + a.type + '] ' + a.name + ': $' + a.balance.toLocaleString('es-AR'));
  }
}
main().catch(e => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
