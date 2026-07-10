import { Controller, Post, Body, Get, Query, Param, Req, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
import { CurrentAccountsService } from './current-accounts.service';
import { FinanceDocumentsService } from './finance-documents.service';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class FinanceController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly cashService: CashService,
    private readonly currentAccountsService: CurrentAccountsService,
    private readonly financeDocumentsService: FinanceDocumentsService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}
  
  @Get('current-accounts')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getCurrentAccounts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('entityType') entityType?: 'CUSTOMER' | 'SUPPLIER',
  ) {
    return this.currentAccountsService.findAll({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 15,
      search,
      entityType,
    });
  }

  @Post('current-accounts/send-overdue')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  sendOverdueStatements() {
    return this.notificationTriggers.sendOverdueNotices();
  }

  @Get('current-accounts/:id')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getCurrentAccount(@Param('id') id: string) {
    return this.currentAccountsService.findById(id);
  }

  @Get('current-accounts/:id/movements')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getCurrentAccountMovements(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.currentAccountsService.getMovements(id, {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 15,
    });
  }

  @Post('current-accounts/:id/send-statement')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  sendManualStatement(
    @Param('id') id: string,
    @Body() body: { channel: 'EMAIL' | 'WHATSAPP' | 'SMS'; recipient: string },
  ) {
    return this.notificationTriggers.sendManualAccountStatement(id, body.channel, body.recipient);
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
    return this.cashService.getActiveShiftForUser(req.user.userId);
  }

  @Post('treasury/shifts/open')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  openShift(@Req() req: any, @Body() body: { cashRegisterId: string, openingAmount: number }) {
    return this.cashService.openShift(body.cashRegisterId, req.user.userId, body.openingAmount);
  }

  @Post('treasury/shifts/close')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  closeShift(@Req() req: any, @Body() body: { shiftId: string, closingAmount: number, notes?: string }) {
    return this.cashService.closeShift(body.shiftId, req.user.userId, body.closingAmount, body.notes);
  }

  @Get('treasury/shifts')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getShifts(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.cashService.getShifts(Number(page) || 1, Number(pageSize) || 15);
  }

  @Get('treasury/shifts/:id')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getShiftById(@Param('id') id: string) {
    return this.cashService.getShiftById(id);
  }

  @Get('treasury/shifts/:id/movements')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getShiftMovements(@Param('id') id: string) {
    return this.cashService.getShiftMovements(id);
  }

  @Post('treasury/shifts/:id/movements')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  addManualMovement(@Req() req: any, @Param('id') id: string, @Body() body: { type: 'INCOME' | 'EXPENSE', amount: number, concept: string }) {
    return this.cashService.addManualMovement(id, req.user.userId, body.type, body.amount, body.concept);
  }

  @Get('payments')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getPayments(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.financeDocumentsService.getPayments({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 15,
      search,
      status,
    });
  }

  @Get('payments/:id')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getPayment(@Param('id') id: string) {
    return this.financeDocumentsService.getPayment(id);
  }

  @Get('invoices')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getInvoices(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.financeDocumentsService.getInvoices({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 15,
      search,
      status,
      type,
    });
  }

  @Get('invoices/by-sale/:saleOrderId')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getInvoicesBySaleOrder(@Param('saleOrderId') saleOrderId: string) {
    return this.financeDocumentsService.getInvoicesBySaleOrder(saleOrderId);
  }

  @Get('invoices/:id')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getInvoice(@Param('id') id: string) {
    return this.financeDocumentsService.getInvoice(id);
  }

  @Post('invoices/issue')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  issueInvoice(@Body() body: any) {
    return this.financeDocumentsService.issueInvoice(body);
  }

  @Post('invoices/:id/retry')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  retryInvoice(@Param('id') id: string) {
    return this.financeDocumentsService.retryInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  cancelInvoice(@Param('id') id: string) {
    return this.financeDocumentsService.cancelInvoice(id);
  }
}
