import { describe, it, expect, beforeEach } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { RestoreMaintenanceGuard } from './restore-maintenance.guard';
import { RestoreMaintenanceService } from './restore-maintenance.service';

describe('RestoreMaintenanceGuard', () => {
  let guard: RestoreMaintenanceGuard;
  let maintenance: RestoreMaintenanceService;

  beforeEach(() => {
    maintenance = new RestoreMaintenanceService();
    guard = new RestoreMaintenanceGuard(maintenance);
  });

  const ctx = (url: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ originalUrl: url, url }),
      }),
    }) as any;

  it('allows requests when restore is not running', () => {
    expect(guard.canActivate(ctx('/api/backups'))).toBe(true);
  });

  it('blocks API requests with 503 while restore is running', () => {
    maintenance.enable();
    expect(() => guard.canActivate(ctx('/api/backups'))).toThrow(ServiceUnavailableException);
  });

  it('allows health checks during restore', () => {
    maintenance.enable();
    expect(guard.canActivate(ctx('/health'))).toBe(true);
  });
});
