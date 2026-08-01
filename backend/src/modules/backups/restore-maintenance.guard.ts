import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RestoreMaintenanceService } from './restore-maintenance.service';

@Injectable()
export class RestoreMaintenanceGuard implements CanActivate {
  constructor(private readonly maintenance: RestoreMaintenanceService) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.maintenance.isActive()) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ url?: string; originalUrl?: string }>();
    const url = request.originalUrl ?? request.url ?? '';
    // Health checks must keep working for process managers / load balancers.
    if (url.includes('/health')) {
      return true;
    }

    throw new ServiceUnavailableException(this.maintenance.getMessage());
  }
}
