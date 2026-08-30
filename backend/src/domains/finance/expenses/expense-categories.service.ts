import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    const categories = await this.prisma.expenseCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        children: {
          where,
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { expenses: true },
        },
      },
    });

    // Auto-seed default categories if database has none
    if (categories.length === 0) {
      await this.seedDefaultCategories();
      return this.prisma.expenseCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          children: { where, orderBy: { name: 'asc' } },
          _count: { select: { expenses: true } },
        },
      });
    }

    return categories;
  }

  async findById(id: string) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { expenses: true } },
      },
    });
    if (!category) throw new NotFoundException('Categoría de gasto no encontrada');
    return category;
  }

  async create(dto: CreateExpenseCategoryDto) {
    const existingCode = await this.prisma.expenseCategory.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existingCode) {
      throw new ConflictException(`Ya existe una categoría con el código '${dto.code}'`);
    }

    const existingName = await this.prisma.expenseCategory.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existingName) {
      throw new ConflictException(`Ya existe una categoría con el nombre '${dto.name}'`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.expenseCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('La categoría padre especificada no existe');
    }

    return this.prisma.expenseCategory.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description?.trim() || null,
        parentId: dto.parentId || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateExpenseCategoryDto) {
    await this.findById(id);

    if (dto.code) {
      const existing = await this.prisma.expenseCategory.findFirst({
        where: { code: dto.code.trim().toUpperCase(), NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe otra categoría con el código '${dto.code}'`);
      }
    }

    if (dto.name) {
      const existing = await this.prisma.expenseCategory.findFirst({
        where: { name: dto.name.trim(), NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe otra categoría con el nombre '${dto.name}'`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Una categoría no puede ser su propia categoría padre');
      }
      const parent = await this.prisma.expenseCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('La categoría padre especificada no existe');
    }

    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async delete(id: string) {
    const category = await this.findById(id);
    if (category._count.expenses > 0) {
      // Soft-delete if has linked expenses
      return this.prisma.expenseCategory.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.expenseCategory.delete({
      where: { id },
    });
  }

  private async seedDefaultCategories() {
    const defaults = [
      { name: 'Alquiler y Expensas', code: 'EXP-RENT', description: 'Alquileres de locales, depósitos y expensas mensuales' },
      { name: 'Servicios e Impuestos', code: 'EXP-SERVICES', description: 'Electricidad, agua, gas, internet, telefonía e impuestos municipales' },
      { name: 'Insumos y Embalaje', code: 'EXP-SUPPLIES', description: 'Bolsas, cajas, etiquetas térmicas, cintas y artículos de librería' },
      { name: 'Sueldos y Honorarios', code: 'EXP-PAYROLL', description: 'Salarios, jornales, comisiones, contador y honorarios profesionales' },
      { name: 'Mantenimiento y Reparaciones', code: 'EXP-MAINTENANCE', description: 'Reparaciones edilicias, sistemas, aire acondicionado, mobiliario' },
      { name: 'Marketing y Publicidad', code: 'EXP-MARKETING', description: 'Publicidad en redes, pauta online, cartelería e impresiones promocionales' },
      { name: 'Retiros de Socios / Dividendos', code: 'EXP-WITHDRAWAL', description: 'Extracciones de capital o adelanto de ganancias de los titulares' },
      { name: 'Viáticos y Refrigerios', code: 'EXP-TRAVEL', description: 'Transporte, combustible, cafetería y comidas de personal' },
      { name: 'Otros Gastos Operativos', code: 'EXP-OTHER', description: 'Gastos menores de caja chica no clasificados' },
    ];

    for (const item of defaults) {
      await this.prisma.expenseCategory.upsert({
        where: { code: item.code },
        update: {},
        create: {
          name: item.name,
          code: item.code,
          description: item.description,
          isActive: true,
        },
      });
    }
  }
}
