import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class StaffInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    title: string;
    body: string;
    event?: string;
    referenceId?: string;
    userId?: string;
  }) {
    return this.prisma.staffNotification.create({
      data: {
        title: payload.title,
        body: payload.body,
        event: payload.event ?? null,
        referenceId: payload.referenceId ?? null,
        userId: payload.userId ?? null,
      },
    });
  }

  async findAll(filters: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filters.unreadOnly) where.readAt = null;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.staffNotification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.staffNotification.count({ where }),
      this.prisma.staffNotification.count({ where: { readAt: null } }),
    ]);

    return { data, total, unreadCount, page, pageSize };
  }

  async markRead(id: string) {
    const existing = await this.prisma.staffNotification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notificación no encontrada');

    return this.prisma.staffNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead() {
    const result = await this.prisma.staffNotification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
