import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Customer } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { isPlaceholderFullName } from './storefront-customer.util';

type CustomerRow = Customer;

/**
 * Resolves and merges storefront customer identities so guest checkouts
 * (keyed only by SaleOrder.customerId) appear under "Mis pedidos" after
 * the shopper authenticates with the same email/phone.
 */
@Injectable()
export class StorefrontCustomerIdentityService {
  private readonly logger = new Logger(StorefrontCustomerIdentityService.name);

  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) return null;
    return email;
  }

  /**
   * Find a customer by email (case-insensitive) or phone.
   */
  async findByIdentifier(identifier: {
    type: 'email' | 'phone';
    value: string;
  }): Promise<CustomerRow | null> {
    if (identifier.type === 'email') {
      const email = this.normalizeEmail(identifier.value);
      if (!email) return null;
      return this.prisma.customer.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        orderBy: { createdAt: 'asc' },
      });
    }

    return this.prisma.customer.findFirst({
      where: { phone: identifier.value },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * After OTP login (or whenever a storefront session is established),
   * pull in any other Customer rows that share email/phone and reassign
   * their ecommerce orders onto `customer`.
   */
  async claimRelatedCustomers(customer: CustomerRow): Promise<CustomerRow> {
    const email = this.normalizeEmail(customer.email);
    const phone = customer.phone?.trim() || null;

    if (!email && !phone) return customer;

    const or: Prisma.CustomerWhereInput[] = [];
    if (email) or.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) or.push({ phone });

    const related = await this.prisma.customer.findMany({
      where: {
        id: { not: customer.id },
        OR: or,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (related.length === 0) {
      // Still normalize email casing on the session customer if needed.
      if (email && customer.email !== email) {
        return this.prisma.customer.update({
          where: { id: customer.id },
          data: { email },
        });
      }
      return customer;
    }

    this.logger.log(
      `[Identity] Claiming ${related.length} related customer(s) into ${customer.id}`,
    );

    return this.mergeInto(customer.id, related.map((r) => r.id));
  }

  /**
   * When the shopper completes/updates their profile with an email, phone,
   * or taxId that already belongs to another customer, absorb that customer
   * (and their orders) instead of failing with a hard conflict.
   */
  async resolveProfileConflict(
    sessionCustomerId: string,
    conflict: { email?: string | null; phone?: string | null; taxId?: string | null },
  ): Promise<CustomerRow | null> {
    const email = this.normalizeEmail(conflict.email);
    const phone = conflict.phone?.trim() || null;
    const taxId = conflict.taxId?.trim() || null;

    const or: Prisma.CustomerWhereInput[] = [];
    if (email) or.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) or.push({ phone });
    if (taxId) or.push({ taxId });

    if (or.length === 0) return null;

    const duplicates = await this.prisma.customer.findMany({
      where: {
        id: { not: sessionCustomerId },
        OR: or,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (duplicates.length === 0) return null;

    // Only auto-merge when the duplicate looks like the same shopper
    // (storefront/guest) or already shares a contact channel with the
    // values being saved. Refuse to silently swallow unrelated ADMIN CRM rows
    // that only collide on taxId with no email/phone overlap.
    const mergeable = duplicates.filter((dup) => {
      const emailMatch = !!(email && this.normalizeEmail(dup.email) === email);
      const phoneMatch = !!(phone && dup.phone === phone);
      if (emailMatch || phoneMatch) return true;
      if (dup.source === 'STOREFRONT' || dup.source === 'POS' || dup.source === 'IMPORT') {
        return true;
      }
      return false;
    });

    if (mergeable.length === 0) return null;

    this.logger.log(
      `[Identity] Profile conflict: merging ${mergeable.length} customer(s) into ${sessionCustomerId}`,
    );

    return this.mergeInto(
      sessionCustomerId,
      mergeable.map((d) => d.id),
    );
  }

  /**
   * Merge `duplicateIds` into `canonicalId`: reassign orders/gift cards,
   * fold loyalty points, copy missing profile fields, then deactivate duplicates.
   */
  async mergeInto(canonicalId: string, duplicateIds: string[]): Promise<CustomerRow> {
    const uniqueDupes = [...new Set(duplicateIds)].filter((id) => id !== canonicalId);
    if (uniqueDupes.length === 0) {
      return this.prisma.customer.findUniqueOrThrow({ where: { id: canonicalId } });
    }

    return this.prisma.$transaction(async (tx) => {
      const canonical = await tx.customer.findUniqueOrThrow({ where: { id: canonicalId } });
      const duplicates = await tx.customer.findMany({
        where: { id: { in: uniqueDupes } },
      });

      let orderCount = 0;
      for (const dup of duplicates) {
        const moved = await tx.saleOrder.updateMany({
          where: { customerId: dup.id },
          data: { customerId: canonicalId },
        });
        orderCount += moved.count;

        await tx.giftCard.updateMany({
          where: { customerId: dup.id },
          data: { customerId: canonicalId },
        });

        const dupLoyalty = await tx.loyaltyAccount.findUnique({
          where: { customerId: dup.id },
        });
        if (dupLoyalty) {
          const canonLoyalty = await tx.loyaltyAccount.findUnique({
            where: { customerId: canonicalId },
          });
          if (canonLoyalty) {
            await tx.loyaltyAccount.update({
              where: { customerId: canonicalId },
              data: { points: canonLoyalty.points + dupLoyalty.points },
            });
            await tx.loyaltyAccount.delete({ where: { customerId: dup.id } });
          } else {
            await tx.loyaltyAccount.update({
              where: { customerId: dup.id },
              data: { customerId: canonicalId },
            });
          }
        }
      }

      const patch = this.buildMergedProfilePatch(canonical, duplicates);
      const updated = Object.keys(patch).length
        ? await tx.customer.update({ where: { id: canonicalId }, data: patch })
        : canonical;

      for (const dup of duplicates) {
        // Free unique taxId and contact fields so they stay available on canonical.
        await tx.customer.update({
          where: { id: dup.id },
          data: {
            isActive: false,
            email: null,
            phone: null,
            taxId: null,
            fullName: `${dup.fullName} (fusionado)`,
            source: dup.source === 'ADMIN' ? 'ADMIN' : 'STOREFRONT',
          },
        });
      }

      this.logger.log(
        `[Identity] Merged ${duplicates.length} customer(s) → ${canonicalId} (${orderCount} orders moved)`,
      );

      return updated;
    });
  }

  private buildMergedProfilePatch(
    canonical: CustomerRow,
    duplicates: CustomerRow[],
  ): Prisma.CustomerUpdateInput {
    const patch: Prisma.CustomerUpdateInput = {};

    const emails = [
      this.normalizeEmail(canonical.email),
      ...duplicates.map((d) => this.normalizeEmail(d.email)),
    ].filter(Boolean) as string[];
    if (!canonical.email && emails[0]) patch.email = emails[0];
    else if (canonical.email && this.normalizeEmail(canonical.email) !== canonical.email) {
      patch.email = this.normalizeEmail(canonical.email)!;
    }

    if (!canonical.phone) {
      const phone = duplicates.map((d) => d.phone).find((p) => !!p?.trim());
      if (phone) patch.phone = phone;
    }

    if (!canonical.taxId) {
      const taxId = duplicates.map((d) => d.taxId).find((t) => !!t?.trim());
      if (taxId) patch.taxId = taxId;
    }

    if (!canonical.taxCondition) {
      const taxCondition = duplicates.map((d) => d.taxCondition).find((t) => !!t?.trim());
      if (taxCondition) patch.taxCondition = taxCondition;
    }

    if (isPlaceholderFullName(canonical.fullName, canonical.email)) {
      const better = duplicates.find(
        (d) => !isPlaceholderFullName(d.fullName, d.email),
      );
      if (better) patch.fullName = better.fullName;
    }

    if (canonical.source !== 'STOREFRONT' && canonical.source !== 'ADMIN') {
      patch.source = 'STOREFRONT';
    }

    // Preserve credit limits from either side (take the max).
    const maxCredit = Math.max(
      canonical.creditLimit ?? 0,
      ...duplicates.map((d) => d.creditLimit ?? 0),
    );
    if (maxCredit > (canonical.creditLimit ?? 0)) {
      patch.creditLimit = maxCredit;
    }

    return patch;
  }
}
