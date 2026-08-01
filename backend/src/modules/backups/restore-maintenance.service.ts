import { Injectable } from '@nestjs/common';

/**
 * In-process flag used while a DB restore is rewriting schemas.
 * HTTP layer returns 503 instead of letting Prisma throw 500s mid-restore.
 */
@Injectable()
export class RestoreMaintenanceService {
  private active = false;
  private readonly message =
    'Se está restaurando un backup. La base de datos no está disponible temporalmente; reintentá en unos segundos.';

  enable() {
    this.active = true;
  }

  disable() {
    this.active = false;
  }

  isActive() {
    return this.active;
  }

  getMessage() {
    return this.message;
  }
}
