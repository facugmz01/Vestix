import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { IssueGiftCardDto, RedeemGiftCardDto } from './dto/gift-card.dto';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  async issue(dto: IssueGiftCardDto) {
    const code = (dto.code ?? this.generateCode()).toUpperCase();

    const existing = await this.prisma.giftCard.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('El código de gift card ya existe');

    return this.prisma.giftCard.create({
      data: {
        code,
        balance: dto.amount,
        initialBalance: dto.amount,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        issuedTo: dto.issuedTo ?? null,
        isActive: true,
      },
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

  async redeem(dto: RedeemGiftCardDto) {
    return this.prisma.$transaction(async (tx) => {
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
    });
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
    const card = await this.prisma.giftCard.findUnique({
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
