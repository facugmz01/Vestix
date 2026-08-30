import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { ExpensesService } from './expenses.service';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseDto, CancelExpenseDto } from './dto/create-expense.dto';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { ExpenseFiltersDto } from './dto/expense-filters.dto';

@Controller('finance/expenses')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly categoriesService: ExpenseCategoriesService,
  ) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getExpenses(@Query() filters: ExpenseFiltersDto) {
    return this.expensesService.getExpenses(filters);
  }

  @Get('summary')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getExpensesSummary(@Query() filters: ExpenseFiltersDto) {
    return this.expensesService.getExpensesSummary(filters);
  }

  @Get('categories')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getCategories(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === 'true');
  }

  @Post('categories')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  createCategory(@Body() dto: CreateExpenseCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('categories/:id')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getExpenseById(@Param('id') id: string) {
    return this.expensesService.getExpenseById(id);
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Finance' })
  createExpense(@Req() req: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.createExpense(dto, {
      userId: req.user.userId || req.user.id,
      email: req.user.email,
      branchId: req.user.branchId,
    });
  }

  @Post(':id/cancel')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  cancelExpense(@Req() req: any, @Param('id') id: string, @Body() dto: CancelExpenseDto) {
    return this.expensesService.cancelExpense(id, dto, {
      userId: req.user.userId || req.user.id,
      email: req.user.email,
    });
  }
}
