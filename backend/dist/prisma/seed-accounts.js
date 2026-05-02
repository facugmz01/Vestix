"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding financial accounts...');
    const branch = await prisma.branch.findFirst();
    if (!branch) {
        console.log('No branches found. Please create a branch first.');
        return;
    }
    const accounts = [
        {
            name: 'Caja Fuerte Principal',
            type: 'CASH',
            currency: 'ARS',
            balance: 1500000,
            branchId: branch.id,
            isActive: true,
        },
        {
            name: 'Banco Galicia (Cta. Cte.)',
            type: 'BANK',
            currency: 'ARS',
            balance: 5000000,
            branchId: branch.id,
            isActive: true,
        },
        {
            name: 'MercadoPago Oficial',
            type: 'BANK',
            currency: 'ARS',
            balance: 250000,
            branchId: branch.id,
            isActive: true,
        }
    ];
    for (const acc of accounts) {
        const created = await prisma.financialAccount.create({
            data: acc
        });
        console.log(`Created account: ${created.name} (Balance: $${created.balance})`);
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-accounts.js.map