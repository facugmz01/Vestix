"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const registers = await prisma.cashRegister.findMany({
        include: { branch: true }
    });
    console.log('CASH REGISTERS:', JSON.stringify(registers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-registers.js.map