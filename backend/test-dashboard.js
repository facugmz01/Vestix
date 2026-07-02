const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.saleOrder.count({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'PAID'] }
      }
    });
    console.log("Count:", count);
  } catch (e) {
    console.error("Error with status:", e);
  }
}
main().finally(() => prisma.$disconnect());
