
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const registers = await prisma.cashRegister.findMany({
    include: { branch: true }
  });
  console.log('CASH REGISTERS:', JSON.stringify(registers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
