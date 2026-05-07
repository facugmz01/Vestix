import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../../core/rbac/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleActivation(id, true);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleActivation(id, false);
  }

  @Patch(':id/branches')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  assignBranches(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignBranchesDto: AssignBranchesDto
  ) {
    return this.usersService.assignBranches(id, assignBranchesDto);
  }
}
