import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Check if the system has already been initialized
   * by looking for any user with the SUPER_ADMIN role.
   */
  async isSystemInitialized(): Promise<boolean> {
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) return false;

    const adminUser = await this.prisma.user.findFirst({
      where: { roleId: superAdminRole.id },
    });

    return !!adminUser;
  }

  /**
   * Step 1: Create the SUPER_ADMIN user and seed all default roles.
   */
  async createSuperAdmin(data: {
    email: string;
    password: string;
    fullName: string;
  }) {
    // 1. Upsert SUPER_ADMIN role with full permissions
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

    // 2. Upsert additional default roles
    const defaultRoles = ['MANAGER', 'CASHIER', 'WAREHOUSE', 'VIEWER'];
    for (const roleName of defaultRoles) {
      await this.prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });
    }

    // 3. Hash password and create the user
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

  /**
   * Step 2: Save company information and seed all default operational data.
   */
  async saveCompanyInfo(data: {
    companyName: string;
    cuit?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    // 1. Create/update the main Branch
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

    // 2. Create default Warehouse
    await this.prisma.warehouse.upsert({
      where: { code: 'DEP-01' },
      update: {},
      create: {
        code: 'DEP-01',
        name: 'Depósito Principal',
        branchId: branch.id,
      },
    });

    // 3. Create default CashRegister
    await this.prisma.cashRegister.upsert({
      where: { code: 'CAJA-01' },
      update: {},
      create: {
        name: 'Caja 1',
        code: 'CAJA-01',
        branchId: branch.id,
      },
    });

    // 4. Create default PaymentMethods
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

    // 5. Create default FinancialAccounts
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

    // 6. Link the SUPER_ADMIN user to this branch
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

    // 7. Create/update StoreSettings
    await this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: { storeName: data.companyName },
      create: {
        id: 'default',
        storeName: data.companyName,
      },
    });

    // 8. Update SystemSettings.general via SettingsService (respects cache + merges properly)
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

    // Ensure the singleton exists first (SettingsService will create it with full defaults if missing)
    await this.settingsService.getSettings();

    // Now update only the general section through the service so the cache is kept in sync
    await this.settingsService.updateAllSettings({ general: generalData as any }, 'setup');

    return { success: true, message: 'Empresa configurada exitosamente' };
  }
}
