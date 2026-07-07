import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  findAll(@Query() query: Record<string, string>) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 15;
    const search = query.search || undefined;
    const role = query.role || undefined;
    const isActive =
      query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;

    return this.usersService.findAll({ page, pageSize, search, role, isActive });
  }

  @Get(':id')
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const requestingUserId = (req as any).user?.userId;
    return this.usersService.remove(id, requestingUserId);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleActivation(id, true);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleActivation(id, false);
  }

  @Patch(':id/branches')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ action: 'manage', subject: 'Users' })
  assignBranches(@Param('id', ParseUUIDPipe) id: string, @Body() assignBranchesDto: AssignBranchesDto) {
    return this.usersService.assignBranches(id, assignBranchesDto);
  }
}
