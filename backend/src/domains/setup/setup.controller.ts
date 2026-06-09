import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { SetupService } from './setup.service';

@Controller('setup')
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

  // Step 2: Save company info (only works if admin exists but company not configured)
  @Post('company')
  async saveCompany(@Body() body: {
    companyName: string;
    cuit?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    return this.setupService.saveCompanyInfo(body);
  }
}
