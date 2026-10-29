import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService, AuditAction } from '../audit/audit.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
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
export class BackupsService implements OnModuleInit {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupDir = join(process.cwd(), 'uploads', 'backups');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @InjectQueue(BACKUPS_QUEUE) private readonly backupsQueue: Queue<BackupJobPayload>,
  ) {
    this.ensureBackupDir();
  }

  async onModuleInit() {
    this.ensureBackupDir();
    await this.cleanStaleJobs().catch((err) => {
      this.logger.error(`Error al limpiar tareas de backup obsoletas en inicio: ${err}`);
    });
    await this.reconcileExistingBackups().catch((err) => {
      this.logger.error(`Error al sincronizar backups desde disco en inicio: ${err}`);
    });
  }

  private ensureBackupDir() {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Identifies jobs stuck in PENDING or IN_PROGRESS for more than 15 minutes
   * (e.g. following a server restart or crash) and marks them FAILED so they
   * do not permanently lock out future backup or restore operations.
   */
  async cleanStaleJobs(): Promise<number> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const staleJobs = await this.prisma.backupJob.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        createdAt: { lt: cutoff },
      },
    });

    if (staleJobs.length === 0) return 0;

    for (const job of staleJobs) {
      await this.prisma.backupJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: 'Operación interrumpida o cancelada por tiempo de espera (timeout).',
          completedAt: new Date(),
        },
      });
      this.logger.warn(`[Backups] Tarea obsoleta ${job.id} (${job.type}) marcada como FAILED.`);
    }

    return staleJobs.length;
  }

  /**
   * Scans uploads/backups for .sql files not yet registered in the DB
   * and registers them as COMPLETED so they remain visible/restorable.
   */
  async reconcileExistingBackups(): Promise<number> {
    if (!existsSync(this.backupDir)) return 0;
    const existing = await this.prisma.backupJob.findMany({
      where: { type: 'MANUAL', filename: { not: null } },
      select: { filename: true },
    });
    const known = new Set(existing.map((j) => j.filename).filter(Boolean) as string[]);
    let count = 0;

    const files = readdirSync(this.backupDir);
    for (const filename of files) {
      if (!filename.endsWith('.sql') || known.has(filename)) continue;
      const filePath = join(this.backupDir, filename);
      let fileSize: bigint | undefined;
      try {
        fileSize = BigInt(statSync(filePath).size);
      } catch {
        continue;
      }

      await this.prisma.backupJob.create({
        data: {
          filename,
          filePath,
          fileSize,
          format: 'SQL',
          status: 'COMPLETED',
          type: 'MANUAL',
          description: 'Sincronizado desde disco',
          completedAt: new Date(),
        },
      });
      known.add(filename);
      count++;
    }

    if (count > 0) {
      this.logger.log(`[Backups] Sincronizados ${count} archivos de backup encontrados en disco.`);
    }
    return count;
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
    await this.cleanStaleJobs();

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

    try {
      await this.backupsQueue.add('create', { backupId: job.id, type: 'CREATE' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.backupJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: `Error al encolar en Redis: ${message}`,
          completedAt: new Date(),
        },
      });
      throw new BadRequestException(`No se pudo iniciar el backup (cola de tareas no disponible): ${message}`);
    }

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
    await this.cleanStaleJobs();

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

    try {
      // Small delay so the HTTP 201 can flush before the worker drops schemas.
      await this.backupsQueue.add(
        'restore',
        { backupId: restoreJob.id, type: 'RESTORE' },
        { delay: 1500 },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.backupJob.update({
        where: { id: restoreJob.id },
        data: {
          status: 'FAILED',
          error: `Error al encolar en Redis: ${message}`,
          completedAt: new Date(),
        },
      });
      throw new BadRequestException(`No se pudo iniciar la restauración (cola de tareas no disponible): ${message}`);
    }

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

  async remove(id: string, userId?: string, userEmail?: string, force = false) {
    const job = await this.prisma.backupJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Backup no encontrado');
    if (job.status === 'IN_PROGRESS' || job.status === 'PENDING') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isStuck = job.createdAt < fiveMinutesAgo;
      if (!force && !isStuck) {
        throw new BadRequestException('No se puede eliminar un backup en progreso reciente');
      }
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
