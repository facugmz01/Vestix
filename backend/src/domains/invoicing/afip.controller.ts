import { Controller, Get, Post, Param, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('afip')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class AfipController {
  constructor(
    @InjectQueue('afip_invoices') private readonly invoiceQueue: Queue,
  ) {}

  @Get('failed-jobs')
  @RequirePermissions({ action: 'read', subject: 'System' })
  async getFailedJobs() {
    const failedJobs = await this.invoiceQueue.getFailed();
    return failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : new Date().toISOString(),
    }));
  }

  @Post('retry-job/:id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async retryJob(@Param('id') id: string) {
    const job = await this.invoiceQueue.getJob(id);
    if (!job) {
      throw new NotFoundException(`Trabajo con ID ${id} no encontrado en la cola.`);
    }

    await job.retry();
    return { success: true, message: `Trabajo ${id} re-encolado para facturación.` };
  }
}
