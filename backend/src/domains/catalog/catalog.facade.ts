import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Facade pattern for the Catalog module.
 * Serves as the anti-corruption layer/public interface for other modules 
 * (like Sales or Logistics) to request data without accessing the DB directly.
 */
@Injectable()
export class CatalogFacade {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves a product variant with its parent product and combo lines if applicable.
   * Can accept a transaction context to ensure consistency within an external transaction.
   */
  async getVariantWithCombos(variantId: string, tx?: any) {
    const db = tx || this.prisma;
    return db.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { include: { comboLines: true } } }
    });
  }

  /**
   * Hydrates an array of variants for cross-domain DTO projection.
   */
  async getVariantsDetails(variantIds: string[], tx?: any) {
    const db = tx || this.prisma;
    return db.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });
  }
}
