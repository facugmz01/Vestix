"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding initial data...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: { name: 'SUPER_ADMIN' }
    });
    await prisma.permission.createMany({
        skipDuplicates: true,
        data: [
            { id: crypto.randomUUID(), action: 'manage', subject: 'all', roleId: adminRole.id }
        ]
    });
    await prisma.user.upsert({
        where: { email: 'admin@erp.com' },
        update: {},
        create: {
            email: 'admin@erp.com',
            password: 'HASHED_PASSWORD_MOCK',
            roleId: adminRole.id
        }
    });
    const branch = await prisma.branch.upsert({
        where: { code: 'CENTRAL' },
        update: {},
        create: { name: 'Casa Central', code: 'CENTRAL', isMain: true }
    });
    const warehouse = await prisma.warehouse.create({
        data: { name: 'Depósito Principal', code: 'DEP-01', branchId: branch.id }
    });
    const product = await prisma.product.create({
        data: { name: 'Remera Básica', categoryId: 'cat-remeras' }
    });
    await prisma.productVariant.create({
        data: {
            productId: product.id,
            sku: 'REM-BAS-BLA-M',
            basePrice: 15000.00
        }
    });
    console.log('Seeding completed successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map