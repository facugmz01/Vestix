import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateBranchConfigDto } from './dto/update-branch-config.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
// import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
// import { AuthGuard } from '../../core/guards/auth.guard';

@Controller('branches')
// @UseGuards(AuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Branch' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Branch' })
  async findAll(@Query() query: any) {
    return this.branchesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Branch' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Branch' })
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateBranchDto: UpdateBranchDto
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Patch(':id/config')
  @RequirePermissions({ action: 'update', subject: 'Branch' })
  updateConfig(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateConfigDto: UpdateBranchConfigDto
  ) {
    // Config is now merged into the main update endpoint via the settings field
    return this.branchesService.update(id, { settings: updateConfigDto } as any);
  }

  @Post(':id/users/:userId')
  @RequirePermissions({ action: 'manage', subject: 'Branch' })
  assignUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string
  ) {
    // This assigns a specific user to this branch, permitting them to open the POS here
    return this.branchesService.assignUserToBranch(id, userId);
  }
}
