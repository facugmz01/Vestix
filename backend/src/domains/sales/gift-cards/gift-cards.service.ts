import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountsService } from '../../finance/accounts.service';
import { SettingsService } from '../../../modules/settings/settings.service';
import { GiftCardTemplateSettings } from '../models/gift-card-template.model';
import { IssueGiftCardDto, RedeemGiftCardDto } from './dto/gift-card.dto';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly settingsService: SettingsService,
  ) {}

  private generateCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  async issue(dto: IssueGiftCardDto) {
    if (dto.customerId && dto.newCustomer) {
      throw new BadRequestException('Indicá un cliente existente o uno nuevo, no ambos');
    }

    const code = (dto.code ?? this.generateCode()).toUpperCase();

    const existing = await this.prisma.giftCard.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('El código de gift card ya existe');

    const account = await this.prisma.financialAccount.findUnique({ where: { id: dto.accountId } });
    if (!account || !account.isActive) {
      throw new BadRequestException('La cuenta financiera seleccionada no es válida');
    }

    return this.prisma.$transaction(async (tx) => {
      let customerId = dto.customerId ?? null;
      let issuedTo = dto.issuedTo?.trim() || null;

      if (dto.newCustomer) {
        const taxId = dto.newCustomer.taxId?.trim() || null;
        const email = dto.newCustomer.email?.trim() || null;

        if (taxId) {
          const exists = await tx.customer.findUnique({ where: { taxId } });
          if (exists) {
            throw new BadRequestException(`El identificador fiscal ${taxId} ya está registrado`);
          }
        }

        const created = await tx.customer.create({
          data: {
            type: dto.newCustomer.type || 'INDIVIDUAL',
            source: 'ADMIN',
            fullName: dto.newCustomer.fullName.trim(),
            taxId,
            email,
            phone: dto.newCustomer.phone?.trim() || null,
          },
        });
        customerId = created.id;
        issuedTo = created.fullName;
      } else if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new NotFoundException('Cliente no encontrado');
        issuedTo = issuedTo || customer.fullName;
      }

      const verificationToken = crypto.randomUUID();
      const card = await tx.giftCard.create({
        data: {
          code,
          balance: dto.amount,
          initialBalance: dto.amount,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          issuedTo,
          customerId,
          fundingType: dto.fundingType,
          fundingNotes: dto.fundingNotes?.trim() || null,
          accountId: dto.accountId,
          verificationToken,
          isActive: true,
        },
        include: {
          customer: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      });

      const recipientLabel = issuedTo || 'Sin destinatario';
      const referenceId = `GC-${card.id}`;

      if (dto.fundingType === 'INCOME') {
        await this.accountsService.postTransactionInTx(
          tx,
          dto.accountId,
          'DEBIT',
          dto.amount,
          referenceId,
          `Ingreso — Venta gift card ${code} — ${recipientLabel}`,
        );
      } else {
        const baseDesc = `Gasto — Emisión gift card ${code} — ${recipientLabel} — Sin ingreso de efectivo`;
        const description = dto.fundingNotes?.trim()
          ? `${baseDesc} — ${dto.fundingNotes.trim()}`
          : baseDesc;

        await this.accountsService.postTransactionInTx(
          tx,
          dto.accountId,
          'CREDIT',
          dto.amount,
          referenceId,
          description,
        );
      }

      return card;
    });
  }

  async findAll(search?: string) {
    const term = search?.trim();
    return this.prisma.giftCard.findMany({
      where: term
        ? {
            OR: [
              { code: { contains: term, mode: 'insensitive' } },
              { issuedTo: { contains: term, mode: 'insensitive' } },
              { customer: { fullName: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getBalance(code: string) {
    const card = await this.findActiveCard(code);
    return {
      code: card.code,
      balance: card.balance,
      expiresAt: card.expiresAt,
      isActive: card.isActive,
    };
  }

  async getTemplate() {
    return this.settingsService.getGiftCardsSettings();
  }

  async updateTemplate(template: GiftCardTemplateSettings, userId: string) {
    return this.settingsService.updateSection('giftCards', { template }, userId);
  }

  async verifyByToken(token: string) {
    const card = await this.prisma.giftCard.findUnique({
      where: { verificationToken: token },
      include: {
        customer: { select: { fullName: true } },
      },
    });
    if (!card) throw new NotFoundException('Gift card no encontrada');

    const isExpired = !!(card.expiresAt && card.expiresAt < new Date());
    const isValid = card.isActive && !isExpired;

    return {
      valid: isValid,
      code: card.code,
      balance: card.balance,
      initialBalance: card.initialBalance,
      expiresAt: card.expiresAt,
      isActive: card.isActive,
      isExpired,
      recipient: card.customer?.fullName || card.issuedTo,
      issuedAt: card.createdAt,
      fundingType: card.fundingType,
    };
  }

  async redeem(dto: RedeemGiftCardDto) {
    return this.prisma.$transaction((tx) => this.redeemInTx(tx, dto));
  }

  async redeemInTx(
    tx: Pick<PrismaService, 'giftCard'>,
    dto: RedeemGiftCardDto,
  ) {

    const card = await this.findActiveCardInTx(tx, dto.code);

    const updated = await tx.giftCard.updateMany({
      where: { id: card.id, balance: { gte: dto.amount } },
      data: { balance: { decrement: dto.amount } },
    });

    if (updated.count === 0) {
      throw new BadRequestException('Saldo insuficiente en la gift card');
    }

    const result = await tx.giftCard.findUniqueOrThrow({ where: { id: card.id } });

    return {
      code: result.code,
      redeemedAmount: dto.amount,
      remainingBalance: result.balance,
    };
  }

  async deactivate(code: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } });
    if (!card) throw new NotFoundException('Gift card no encontrada');

    return this.prisma.giftCard.update({
      where: { id: card.id },
      data: { isActive: false },
    });
  }

  private async findActiveCard(code: string) {
    return this.findActiveCardInTx(this.prisma, code);
  }

  private async findActiveCardInTx(
    tx: Pick<PrismaService, 'giftCard'>,
    code: string,
  ) {
    const card = await tx.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!card) throw new NotFoundException('Gift card no encontrada');
    if (!card.isActive) throw new BadRequestException('Gift card inactiva');
    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('Gift card vencida');
    }
    return card;
  }
}
