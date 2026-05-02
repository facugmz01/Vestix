import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesController } from './roles.controller';

@Global()
@Module({
  controllers: [UsersController, RolesController],
  providers: [UsersService],
  exports: [UsersService], // Exporting so AuthModule can validate logins
})
export class UsersModule {}
