import { Module, Global } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { PermissionsGuard } from './guards/permissions.guard';

// We make this Global so that @RequirePermissions and the Guard can be used 
// across all feature modules without needing to import RbacModule everywhere.
@Global()
@Module({
  providers: [RbacService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
