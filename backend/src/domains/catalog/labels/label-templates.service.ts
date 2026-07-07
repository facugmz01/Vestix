import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateLabelTemplateDto,
  UpdateLabelTemplateDto,
} from './dto/label-template.dto';
import {
  buildLayoutFromOptions,
  LabelLayout,
  PRESET_LABEL_TEMPLATES,
} from './label-layout.types';

@Injectable()
export class LabelTemplatesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.labelTemplate.count();
    if (count === 0) {
      await this.seedPresets();
    }
  }

  async findAll() {
    return this.prisma.labelTemplate.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.labelTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla de etiqueta no encontrada');
    return template;
  }

  async findDefault() {
    const defaultTpl = await this.prisma.labelTemplate.findFirst({
      where: { isDefault: true },
    });
    if (defaultTpl) return defaultTpl;

    const first = await this.prisma.labelTemplate.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!first) throw new NotFoundException('No hay plantillas de etiqueta configuradas');
    return first;
  }

  async create(dto: CreateLabelTemplateDto) {
    const layout = this.resolveLayout(dto);

    if (dto.isDefault) {
      await this.prisma.labelTemplate.updateMany({ data: { isDefault: false } });
    }

    return this.prisma.labelTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        labelWidth: dto.labelWidth,
        labelHeight: dto.labelHeight,
        paperType: dto.paperType ?? 'ROLL',
        paperWidth: dto.paperWidth,
        paperHeight: dto.paperHeight,
        marginTop: dto.marginTop ?? 0,
        marginLeft: dto.marginLeft ?? 0,
        rowGap: dto.rowGap ?? 0,
        colGap: dto.colGap ?? 0,
        colsPerRow: dto.colsPerRow ?? 1,
        labelsPerSheet: dto.labelsPerSheet,
        layout: layout as object,
        isDefault: dto.isDefault ?? false,
        isSystem: false,
      },
    });
  }

  async update(id: string, dto: UpdateLabelTemplateDto) {
    const existing = await this.findOne(id);

    const layout = dto.layout
      ? dto.layout
      : this.hasLayoutOptions(dto)
        ? this.resolveLayout({
            labelWidth: dto.labelWidth ?? existing.labelWidth,
            showStoreName: dto.showStoreName,
            showProductName: dto.showProductName,
            showSizeColor: dto.showSizeColor,
            showBarcode: dto.showBarcode,
            showPrice: dto.showPrice,
            barcodeSymbology: dto.barcodeSymbology,
          } as CreateLabelTemplateDto, existing.layout as unknown as LabelLayout)
        : undefined;

    if (dto.isDefault) {
      await this.prisma.labelTemplate.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.labelTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.labelWidth !== undefined && { labelWidth: dto.labelWidth }),
        ...(dto.labelHeight !== undefined && { labelHeight: dto.labelHeight }),
        ...(dto.paperType !== undefined && { paperType: dto.paperType }),
        ...(dto.paperWidth !== undefined && { paperWidth: dto.paperWidth }),
        ...(dto.paperHeight !== undefined && { paperHeight: dto.paperHeight }),
        ...(dto.marginTop !== undefined && { marginTop: dto.marginTop }),
        ...(dto.marginLeft !== undefined && { marginLeft: dto.marginLeft }),
        ...(dto.rowGap !== undefined && { rowGap: dto.rowGap }),
        ...(dto.colGap !== undefined && { colGap: dto.colGap }),
        ...(dto.colsPerRow !== undefined && { colsPerRow: dto.colsPerRow }),
        ...(dto.labelsPerSheet !== undefined && { labelsPerSheet: dto.labelsPerSheet }),
        ...(layout !== undefined && { layout: layout as object }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.isSystem) {
      throw new ConflictException('No se pueden eliminar plantillas del sistema');
    }
    if (existing.isDefault) {
      throw new BadRequestException('No se puede eliminar la plantilla por defecto');
    }
    await this.prisma.labelTemplate.delete({ where: { id } });
    return { success: true };
  }

  async setDefault(id: string) {
    await this.findOne(id);
    await this.prisma.labelTemplate.updateMany({ data: { isDefault: false } });
    return this.prisma.labelTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async duplicate(id: string) {
    const source = await this.findOne(id);
    return this.prisma.labelTemplate.create({
      data: {
        name: `${source.name} (copia)`,
        description: source.description,
        labelWidth: source.labelWidth,
        labelHeight: source.labelHeight,
        paperType: source.paperType,
        paperWidth: source.paperWidth,
        paperHeight: source.paperHeight,
        marginTop: source.marginTop,
        marginLeft: source.marginLeft,
        rowGap: source.rowGap,
        colGap: source.colGap,
        colsPerRow: source.colsPerRow,
        labelsPerSheet: source.labelsPerSheet,
        layout: source.layout as object,
        isDefault: false,
        isSystem: false,
      },
    });
  }

  async seedPresets() {
    for (const preset of PRESET_LABEL_TEMPLATES) {
      const existing = await this.prisma.labelTemplate.findFirst({
        where: { name: preset.name, isSystem: true },
      });
      if (!existing) {
        await this.prisma.labelTemplate.create({
          data: {
            ...preset,
            layout: preset.layout as object,
          },
        });
      }
    }
  }

  private resolveLayout(
    dto: Pick<
      CreateLabelTemplateDto,
      | 'labelWidth'
      | 'labelHeight'
      | 'layout'
      | 'showStoreName'
      | 'showProductName'
      | 'showSizeColor'
      | 'showBarcode'
      | 'showPrice'
      | 'barcodeSymbology'
    >,
    fallback?: LabelLayout,
  ): LabelLayout {
    if (dto.layout) return dto.layout;

    const width = dto.labelWidth ?? 38;
    const height = dto.labelHeight ?? 25;

    if (!this.hasLayoutOptions(dto) && fallback) return fallback;

    return buildLayoutFromOptions(width, height, {
      showStoreName: dto.showStoreName,
      showProductName: dto.showProductName,
      showSizeColor: dto.showSizeColor,
      showBarcode: dto.showBarcode,
      showPrice: dto.showPrice,
      barcodeSymbology: dto.barcodeSymbology,
    });
  }

  private hasLayoutOptions(dto: Partial<CreateLabelTemplateDto>): boolean {
    return (
      dto.showStoreName !== undefined ||
      dto.showProductName !== undefined ||
      dto.showSizeColor !== undefined ||
      dto.showBarcode !== undefined ||
      dto.showPrice !== undefined ||
      dto.barcodeSymbology !== undefined
    );
  }
}
