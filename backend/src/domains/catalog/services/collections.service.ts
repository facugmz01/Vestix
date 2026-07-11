import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from '../dto/collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCollectionDto) {
    return this.prisma.productCollection.create({
      data: {
        name: dto.name,
        season: dto.season ?? null,
        year: dto.year ?? null,
        isActive: dto.isActive ?? true,
        products: dto.productIds?.length
          ? { create: dto.productIds.map((productId) => ({ productId })) }
          : undefined,
      },
      include: { products: { include: { product: { select: { id: true, name: true } } } } },
    });
  }

  async findAll(activeOnly?: boolean) {
    return this.prisma.productCollection.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        _count: { select: { products: true } },
      },
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const collection = await this.prisma.productCollection.findUnique({
      where: { id },
      include: { products: { include: { product: { select: { id: true, name: true, baseSku: true } } } } },
    });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return collection;
  }

  async update(id: string, dto: UpdateCollectionDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.productIds !== undefined) {
        await tx.productCollectionItem.deleteMany({ where: { collectionId: id } });
        if (dto.productIds.length > 0) {
          await tx.productCollectionItem.createMany({
            data: dto.productIds.map((productId) => ({ collectionId: id, productId })),
          });
        }
      }

      return tx.productCollection.update({
        where: { id },
        data: {
          name: dto.name,
          season: dto.season,
          year: dto.year,
          isActive: dto.isActive,
        },
        include: { products: { include: { product: { select: { id: true, name: true } } } } },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.productCollection.delete({ where: { id } });
    return { deleted: true };
  }
}
