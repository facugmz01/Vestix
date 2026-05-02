import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService], // Exported for Inventory/Sales modules to validate branch IDs
})
export class BranchesModule {}
