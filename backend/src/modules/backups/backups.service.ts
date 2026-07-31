import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService, AuditAction } from '../audit/audit.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

export const BACKUPS_QUEUE = 'backups_queue';

export interface BackupJobPayload {
  backupId: string;
  type: 'CREATE' | 'RESTORE';
}

export interface DbConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir = join(process.cwd(), 'uploads', 'backups');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @InjectQueue(BACKUPS_QUEUE) private readonly backupsQueue: Queue<BackupJobPayload>,
  ) {
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  parseDatabaseUrl(): DbConnectionConfig {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new BadRequestException('DATABASE_URL no está configurada');
    }

    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || '127.0.0.1',
        port: parsed.port ? parseInt(parsed.port, 10) : 5432,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
      };
    } catch {
      throw new BadRequestException('DATABASE_URL inválida');
    }
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.backupJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.backupJob.count(),
    ]);

    return {
      data: data.map((job) => this.serialize(job)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Backup no encontrado');
    return this.serialize(job);
  }

  async create(dto: CreateBackupDto, userId?: string, userEmail?: string) {
    const inProgress = await this.prisma.backupJob.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] }, type: 'MANUAL' },
    });
    if (inProgress > 0) {
      throw new BadRequestException('Ya hay un backup en progreso. Esperá a que finalice.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = join(this.backupDir, filename);

    const job = await this.prisma.backupJob.create({
      data: {
        filename,
        filePath,
        format: 'SQL',
        status: 'PENDING',
        type: 'MANUAL',
        description: dto.description,
        createdById: userId,
        createdByEmail: userEmail,
      },
    });

    await this.backupsQueue.add('create', { backupId: job.id, type: 'CREATE' });

    this.auditService.log({
      userId: userId ?? 'system',
      userEmail,
      action: AuditAction.CREATE,
      resource: 'BackupJob',
      resourceId: job.id,
      module: 'Backups',
      description: `Backup manual iniciado: ${filename}`,
    }).catch(() => {});

    return this.serialize(job);
  }

  async restore(id: string, userId?: string, userEmail?: string) {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Backup no encontrado');
    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Solo se pueden restaurar backups completados');
    }
    if (!job.filePath || !existsSync(job.filePath)) {
      throw new BadRequestException('El archivo de backup no existe en el servidor');
    }

    const inProgress = await this.prisma.backupJob.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });
    if (inProgress > 0) {
      throw new BadRequestException('Hay una operación de backup/restauración en progreso');
    }

    const restoreJob = await this.prisma.backupJob.create({
      data: {
        filename: job.filename,
        filePath: job.filePath,
        format: job.format,
        status: 'PENDING',
        type: 'RESTORE',
        description: `Restauración desde backup ${job.filename}`,
        createdById: userId,
        createdByEmail: userEmail,
      },
    });

    // Small delay so the HTTP 201 can flush before the worker drops schemas.
    await this.backupsQueue.add(
      'restore',
      { backupId: restoreJob.id, type: 'RESTORE' },
      { delay: 1500 },
    );

    this.auditService.log({
      userId: userId ?? 'system',
      userEmail,
      action: 'RESTORE',
      resource: 'BackupJob',
      resourceId: job.id,
      module: 'Backups',
      description: `Restauración iniciada desde: ${job.filename}`,
    }).catch(() => {});

    return this.serialize(restoreJob);
  }

  async remove(id: string, userId?: string, userEmail?: string) {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Backup no encontrado');
    if (job.status === 'IN_PROGRESS' || job.status === 'PENDING') {
      throw new BadRequestException('No se puede eliminar un backup en progreso');
    }

    if (job.filePath && existsSync(job.filePath) && job.type === 'MANUAL') {
      try {
        unlinkSync(job.filePath);
      } catch (err) {
        this.logger.warn(`No se pudo eliminar el archivo ${job.filePath}: ${err}`);
      }
    }

    await this.prisma.backupJob.delete({ where: { id } });

    this.auditService.log({
      userId: userId ?? 'system',
      userEmail,
      action: AuditAction.DELETE,
      resource: 'BackupJob',
      resourceId: id,
      module: 'Backups',
      description: `Backup eliminado: ${job.filename}`,
    }).catch(() => {});

    return { success: true };
  }

  async getDownloadPath(id: string): Promise<{ filePath: string; filename: string }> {
    return this.findDownloadable(id);
  }

  private async findDownloadable(id: string) {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Backup no encontrado');
    if (job.status !== 'COMPLETED' || job.type !== 'MANUAL') {
      throw new BadRequestException('El backup no está disponible para descarga');
    }
    if (!job.filePath || !existsSync(job.filePath)) {
      throw new NotFoundException('Archivo de backup no encontrado');
    }
    return { filePath: job.filePath, filename: job.filename ?? 'backup.sql' };
  }

  private serialize(job: {
    id: string;
    filename: string | null;
    filePath: string | null;
    fileSize: bigint | null;
    format: string;
    status: string;
    type: string;
    description: string | null;
    error: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdById: string | null;
    createdByEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...job,
      fileSize: job.fileSize != null ? Number(job.fileSize) : null,
    };
  }
}
