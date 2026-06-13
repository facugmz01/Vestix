import { Controller, Get, Query, Post, Body, Patch, Param, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly cashService: CashService,
  ) {}
  
  @Get('current-accounts')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getCurrentAccounts(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get('treasury/accounts')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getAccounts() {
    return this.accountsService.getAccounts();
  }

  // --- Payment Methods ---
  @Get('payment-methods')
  @RequirePermissions({ action: 'read', subject: 'Settings' }) // or Finance depending on user setup
  getPaymentMethods() {
    return this.accountsService.getPaymentMethods();
  }

  @Post('payment-methods')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  createPaymentMethod(@Body() body: any) {
    return this.accountsService.createPaymentMethod(body);
  }

  @Patch('payment-methods/:id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  updatePaymentMethod(@Param('id') id: string, @Body() body: any) {
    return this.accountsService.updatePaymentMethod(id, body);
  }

  @Get('treasury/shifts/active')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getActiveShift(@Req() req: any) {
    // req.user contains the authenticated user token
    return this.cashService.getActiveShiftForUser(req.user.id);
  }

  @Post('treasury/shifts/open')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  openShift(@Req() req: any, @Body() body: { cashRegisterId: string, openingAmount: number }) {
    return this.cashService.openShift(body.cashRegisterId, req.user.id, body.openingAmount);
  }

  @Post('treasury/shifts/close')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  closeShift(@Req() req: any, @Body() body: { shiftId: string, closingAmount: number, notes?: string }) {
    return this.cashService.closeShift(body.shiftId, req.user.id, body.closingAmount, body.notes);
  }

  @Get('payments')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getPayments(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get('invoices')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getInvoices(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
