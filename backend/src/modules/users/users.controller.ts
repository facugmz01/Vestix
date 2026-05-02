import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';

// In production, these endpoints must be guarded
// import { UseGuards } from '@nestjs/common';
// import { AuthGuard } from '../../core/guards/auth.guard';
// import { RolesGuard } from '../../core/guards/roles.guard';
// import { Roles } from '../../core/decorators/roles.decorator';
// import { UserRole } from './dto/create-user.dto';

@Controller('users')
// @UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  // @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Note: Add logic to allow a user to view their own profile
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  // @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.SUPER_ADMIN)
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleActivation(id, true);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.SUPER_ADMIN)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleActivation(id, false);
  }

  @Patch(':id/branches')
  @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.SUPER_ADMIN)
  assignBranches(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignBranchesDto: AssignBranchesDto
  ) {
    return this.usersService.assignBranches(id, assignBranchesDto);
  }
}
