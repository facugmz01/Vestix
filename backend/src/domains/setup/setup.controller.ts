import { Controller, Get, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { SetupService } from './setup.service';

@Controller('setup')
@UseGuards(ThrottlerGuard)
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  // Public endpoint - no auth guard
  @Get('status')
  async getStatus() {
    const isInitialized = await this.setupService.isSystemInitialized();
    return { isInitialized };
  }

  // Step 1: Create super admin (only works if no admin exists)
  @Post('admin')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createAdmin(@Body() body: {
    email: string;
    password: string;
    fullName: string;
  }) {
    const isInitialized = await this.setupService.isSystemInitialized();
    if (isInitialized) {
      throw new BadRequestException('El sistema ya fue configurado. No se puede crear otro admin desde el setup.');
    }
    return this.setupService.createSuperAdmin(body);
  }

  // Step 2: Save company info (only works if system is NOT fully configured yet)
  @Post('company')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async saveCompany(@Body() body: {
    companyName: string;
    cuit?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    const isInitialized = await this.setupService.isSystemInitialized();
    if (!isInitialized) {
      throw new BadRequestException('Primero debés crear un Super Administrador.');
    }
    // Block if the main branch already exists (setup already completed)
    const hasCompany = await this.setupService.isCompanyConfigured();
    if (hasCompany) {
      throw new BadRequestException('La empresa ya fue configurada. Usá el módulo de Configuraciones para modificar los datos.');
    }
    return this.setupService.saveCompanyInfo(body);
  }
}
