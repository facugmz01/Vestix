import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildPrepareRestoreSql } from './backup-restore.util';
import { RestoreMaintenanceService } from './restore-maintenance.service';
import { BackupsService, BackupJobPayload, BACKUPS_QUEUE, DbConnectionConfig } from './backups.service';

const execFileAsync = promisify(execFile);

type BackupJobSnapshot = {
  id: string;
  filename: string | null;
  filePath: string | null;
  format: string;
  description: string | null;
  createdById: string | null;
  createdByEmail: string | null;
  startedAt: Date | null;
};

@Processor(BACKUPS_QUEUE)
export class BackupsProcessor extends WorkerHost {
  private readonly logger = new Logger(BackupsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupsService: BackupsService,
    private readonly maintenance: RestoreMaintenanceService,
  ) {
    super();
  }

  async process(job: Job<BackupJobPayload>) {
    const { backupId, type } = job.data;
    this.logger.log(`[Backups] Processing ${type} job for backup ${backupId}`);

    const record = await this.prisma.backupJob.findUnique({ where: { id: backupId } });
    if (!record) {
      throw new Error(`BackupJob ${backupId} not found`);
    }

    const snapshot: BackupJobSnapshot = {
      id: record.id,
      filename: record.filename,
      filePath: record.filePath,
      format: record.format,
      description: record.description,
      createdById: record.createdById,
      createdByEmail: record.createdByEmail,
      startedAt: new Date(),
    };

    await this.prisma.backupJob.update({
      where: { id: backupId },
      data: { status: 'IN_PROGRESS', startedAt: snapshot.startedAt, error: null },
    });

    try {
      if (type === 'CREATE') {
        await this.runPgDump(record.filePath!);
        const fileSize = statSync(record.filePath!).size;
        await this.prisma.backupJob.update({
          where: { id: backupId },
          data: {
            status: 'COMPLETED',
            fileSize: BigInt(fileSize),
            completedAt: new Date(),
          },
        });
      } else if (type === 'RESTORE') {
        await this.runRestoreWithMaintenance(snapshot);
      }
      this.logger.log(`[Backups] ✓ Job ${job.id} completed`);
    } catch (err: unknown) {
      const message = this.formatExecError(err);
      this.logger.error(`[Backups] Job ${backupId} failed: ${message}`);
      await this.markJobFailed(snapshot, type, message);
      throw err;
    }
  }

  private async runRestoreWithMaintenance(snapshot: BackupJobSnapshot) {
    if (!snapshot.filePath) {
      throw new Error('Backup filePath is missing');
    }

    this.maintenance.enable();
    // Let in-flight HTTP responses finish before schemas disappear.
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      await this.prisma.$disconnect();
      await this.runPsqlRestore(snapshot.filePath);
      await this.prisma.$connect();
      await this.markRestoreCompleted(snapshot);
      await this.reconcileBackupFilesFromDisk(snapshot.id);
    } finally {
      try {
        await this.prisma.$connect();
      } catch {
        // already connected or reconnect will happen on next query
      }
      this.maintenance.disable();
    }
  }

  private async runPgDump(filePath: string) {
    const db = this.backupsService.parseDatabaseUrl();
    const args = [
      '-h', db.host,
      '-p', String(db.port),
      '-U', db.user,
      '-d', db.database,
      '-F', 'p',
      '--no-owner',
      '--no-acl',
      // So restores into a live DB can DROP conflicting objects first.
      '--clean',
      '--if-exists',
      // Quoted identifier required — Prisma table is core."BackupJob".
      '--exclude-table-data=core."BackupJob"',
      '-f', filePath,
    ];

    await execFileAsync('pg_dump', args, {
      env: { ...process.env, PGPASSWORD: db.password },
      maxBuffer: 1024 * 1024 * 256,
    });
  }

  private async runPsqlRestore(filePath: string) {
    const db = this.backupsService.parseDatabaseUrl();
    // Existing backups (without --clean) emit bare CREATE SCHEMA and fail when
    // schemas like "catalog" already exist. Clear app schemas first.
    await this.prepareDatabaseForRestore(db);

    const args = [
      '-h', db.host,
      '-p', String(db.port),
      '-U', db.user,
      '-d', db.database,
      '-v', 'ON_ERROR_STOP=1',
      '-X', // ignore .psqlrc
      '-f', filePath,
    ];

    await execFileAsync('psql', args, {
      env: { ...process.env, PGPASSWORD: db.password },
      maxBuffer: 1024 * 1024 * 256,
    });
  }

  private async prepareDatabaseForRestore(db: DbConnectionConfig) {
    const sql = buildPrepareRestoreSql();
    this.logger.warn('[Backups] Dropping existing app schemas before restore');

    await execFileAsync(
      'psql',
      [
        '-h', db.host,
        '-p', String(db.port),
        '-U', db.user,
        '-d', db.database,
        '-v', 'ON_ERROR_STOP=1',
        '-X',
        '-c', sql,
      ],
      {
        env: { ...process.env, PGPASSWORD: db.password },
        maxBuffer: 1024 * 1024 * 16,
      },
    );
  }

  /**
   * Full SQL restore replaces core.BackupJob, so the RESTORE row created before
   * the dump is gone. Recreate it as COMPLETED from the in-memory snapshot.
   */
  private async markRestoreCompleted(snapshot: BackupJobSnapshot) {
    const completedAt = new Date();
    await this.prisma.backupJob.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        filename: snapshot.filename,
        filePath: snapshot.filePath,
        format: snapshot.format,
        status: 'COMPLETED',
        type: 'RESTORE',
        description: snapshot.description ?? `Restauración desde backup ${snapshot.filename}`,
        startedAt: snapshot.startedAt,
        completedAt,
        createdById: snapshot.createdById,
        createdByEmail: snapshot.createdByEmail,
      },
      update: {
        status: 'COMPLETED',
        type: 'RESTORE',
        error: null,
        completedAt,
        startedAt: snapshot.startedAt,
      },
    });
  }

  private async markJobFailed(
    snapshot: BackupJobSnapshot,
    type: BackupJobPayload['type'],
    message: string,
  ) {
    try {
      await this.prisma.$connect();
    } catch {
      // ignore
    }

    const jobType = type === 'RESTORE' ? 'RESTORE' : 'MANUAL';

    try {
      await this.prisma.backupJob.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          filename: snapshot.filename,
          filePath: snapshot.filePath,
          format: snapshot.format,
          status: 'FAILED',
          type: jobType,
          description: snapshot.description,
          error: message.slice(0, 4000),
          startedAt: snapshot.startedAt,
          completedAt: new Date(),
          createdById: snapshot.createdById,
          createdByEmail: snapshot.createdByEmail,
        },
        update: {
          status: 'FAILED',
          error: message.slice(0, 4000),
          completedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(
        `[Backups] Could not persist FAILED status for ${snapshot.id}: ${this.formatExecError(err)}`,
      );
    }
  }

  /** Re-register SQL files on disk so manual backups remain visible after restore. */
  private async reconcileBackupFilesFromDisk(restoreJobId: string) {
    const dir = join(process.cwd(), 'uploads', 'backups');
    if (!existsSync(dir)) return;

    // Heal leftover IN_PROGRESS rows from older dumps that included BackupJob data.
    const stuck = await this.prisma.backupJob.findMany({
      where: {
        type: 'MANUAL',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        filePath: { not: null },
      },
    });
    for (const job of stuck) {
      if (!job.filePath || !existsSync(job.filePath)) continue;
      const fileSize = BigInt(statSync(job.filePath).size);
      await this.prisma.backupJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          fileSize,
          completedAt: job.completedAt ?? new Date(),
          error: null,
        },
      });
    }

    const existing = await this.prisma.backupJob.findMany({
      where: { type: 'MANUAL', filename: { not: null } },
      select: { filename: true },
    });
    const known = new Set(existing.map((j) => j.filename).filter(Boolean) as string[]);

    for (const filename of readdirSync(dir)) {
      if (!filename.endsWith('.sql') || known.has(filename)) continue;
      const filePath = join(dir, filename);
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
          description: 'Reindexado tras restauración',
          completedAt: new Date(),
        },
      });
      this.logger.log(`[Backups] Reindexed backup file ${filename} after restore ${restoreJobId}`);
    }
  }

  private formatExecError(err: unknown): string {
    if (!err || typeof err !== 'object') return String(err);
    const e = err as { stderr?: unknown; stdout?: unknown; message?: unknown };
    const parts = [e.stderr, e.stdout, e.message]
      .map((part) => {
        if (part == null) return '';
        if (Buffer.isBuffer(part)) return part.toString('utf8');
        return String(part);
      })
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.join('\n') || 'Unknown backup error';
  }
}
