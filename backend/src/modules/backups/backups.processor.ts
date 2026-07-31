import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { statSync } from 'fs';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildPrepareRestoreSql } from './backup-restore.util';
import { BackupsService, BackupJobPayload, BACKUPS_QUEUE, DbConnectionConfig } from './backups.service';

const execFileAsync = promisify(execFile);

@Processor(BACKUPS_QUEUE)
export class BackupsProcessor extends WorkerHost {
  private readonly logger = new Logger(BackupsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupsService: BackupsService,
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

    await this.prisma.backupJob.update({
      where: { id: backupId },
      data: { status: 'IN_PROGRESS', startedAt: new Date(), error: null },
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
        await this.runPsqlRestore(record.filePath!);
        await this.prisma.backupJob.update({
          where: { id: backupId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
      this.logger.log(`[Backups] ✓ Job ${job.id} completed`);
    } catch (err: any) {
      const message = err?.stderr || err?.message || String(err);
      await this.prisma.backupJob.update({
        where: { id: backupId },
        data: { status: 'FAILED', error: message, completedAt: new Date() },
      });
      throw err;
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
        '-c', sql,
      ],
      {
        env: { ...process.env, PGPASSWORD: db.password },
        maxBuffer: 1024 * 1024 * 16,
      },
    );
  }
}
