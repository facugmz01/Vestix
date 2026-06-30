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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const settings_service_1 = require("../../modules/settings/settings.service");
const bcrypt = __importStar(require("bcrypt"));
let SetupService = class SetupService {
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
    }
    async isSystemInitialized() {
        const superAdminRole = await this.prisma.role.findUnique({
            where: { name: 'SUPER_ADMIN' },
        });
        if (!superAdminRole)
            return false;
        const adminUser = await this.prisma.user.findFirst({
            where: { roleId: superAdminRole.id },
        });
        return !!adminUser;
    }
    async isCompanyConfigured() {
        const branch = await this.prisma.branch.findFirst({
            where: { code: 'CENTRAL' },
        });
        return !!branch;
    }
    async createSuperAdmin(data) {
        const superAdminRole = await this.prisma.role.upsert({
            where: { name: 'SUPER_ADMIN' },
            update: {},
            create: {
                name: 'SUPER_ADMIN',
                permissions: {
                    create: [{ action: 'manage', subject: 'all' }],
                },
            },
        });
        const defaultRoles = ['MANAGER', 'CASHIER', 'WAREHOUSE', 'VIEWER'];
        for (const roleName of defaultRoles) {
            await this.prisma.role.upsert({
                where: { name: roleName },
                update: {},
                create: { name: roleName },
            });
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                fullName: data.fullName,
                roleId: superAdminRole.id,
            },
        });
        return { success: true, message: 'Super Admin creado exitosamente' };
    }
    async saveCompanyInfo(data) {
        const branch = await this.prisma.branch.upsert({
            where: { code: 'CENTRAL' },
            update: {
                name: `${data.companyName} - Casa Central`,
                address: data.address || '',
                phone: data.phone || '',
                settings: {
                    taxId: data.cuit,
                    companyName: data.companyName,
                    companyEmail: data.email,
                    companyPhone: data.phone,
                    companyAddress: data.address,
                    posReceiptHeader: data.companyName,
                    posReceiptFooter: `CUIT: ${data.cuit || ''} | ${data.address || ''}`,
                },
            },
            create: {
                name: `${data.companyName} - Casa Central`,
                code: 'CENTRAL',
                isMain: true,
                address: data.address || '',
                phone: data.phone || '',
                settings: {
                    taxId: data.cuit,
                    companyName: data.companyName,
                    companyEmail: data.email,
                    companyPhone: data.phone,
                    companyAddress: data.address,
                    posReceiptHeader: data.companyName,
                    posReceiptFooter: `CUIT: ${data.cuit || ''} | ${data.address || ''}`,
                },
            },
        });
        await this.prisma.warehouse.upsert({
            where: { code: 'DEP-01' },
            update: {},
            create: {
                code: 'DEP-01',
                name: 'Depósito Principal',
                branchId: branch.id,
            },
        });
        await this.prisma.cashRegister.upsert({
            where: { code: 'CAJA-01' },
            update: {},
            create: {
                name: 'Caja 1',
                code: 'CAJA-01',
                branchId: branch.id,
            },
        });
        const paymentMethods = [
            { name: 'Efectivo', type: 'CASH' },
            { name: 'Tarjeta de Débito', type: 'DEBIT_CARD' },
            { name: 'Tarjeta de Crédito', type: 'CREDIT_CARD' },
            { name: 'Transferencia Bancaria', type: 'BANK_TRANSFER' },
            { name: 'MercadoPago', type: 'DIGITAL_WALLET' },
        ];
        for (const pm of paymentMethods) {
            const existing = await this.prisma.paymentMethod.findFirst({
                where: { name: pm.name },
            });
            if (!existing) {
                await this.prisma.paymentMethod.create({
                    data: {
                        name: pm.name,
                        type: pm.type,
                    },
                });
            }
        }
        const financialAccounts = [
            { name: 'Caja Principal', type: 'CASH', currency: 'ARS', balance: 0 },
            { name: 'Cuenta Bancaria', type: 'BANK', currency: 'ARS', balance: 0 },
        ];
        for (const fa of financialAccounts) {
            const existing = await this.prisma.financialAccount.findFirst({
                where: { name: fa.name },
            });
            if (!existing) {
                await this.prisma.financialAccount.create({
                    data: {
                        name: fa.name,
                        type: fa.type,
                        currency: fa.currency,
                        balance: fa.balance,
                        branchId: branch.id,
                    },
                });
            }
        }
        const superAdminRole = await this.prisma.role.findUnique({
            where: { name: 'SUPER_ADMIN' },
        });
        if (superAdminRole) {
            const adminUser = await this.prisma.user.findFirst({
                where: { roleId: superAdminRole.id },
            });
            if (adminUser) {
                await this.prisma.user.update({
                    where: { id: adminUser.id },
                    data: { branchId: branch.id },
                });
            }
        }
        await this.settingsService.updateAllSettings({
            storefront: {
                storeName: data.companyName,
            }
        }, 'setup');
        const generalData = {
            companyName: data.companyName,
            legalName: data.companyName,
            taxId: data.cuit || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR',
            currency: 'ARS',
        };
        await this.settingsService.getSettings();
        await this.settingsService.updateAllSettings({ general: generalData }, 'setup');
        return { success: true, message: 'Empresa configurada exitosamente' };
    }
};
exports.SetupService = SetupService;
exports.SetupService = SetupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], SetupService);
//# sourceMappingURL=setup.service.js.map