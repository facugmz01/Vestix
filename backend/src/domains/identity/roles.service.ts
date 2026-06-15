import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface CreateRoleDto {
  name: string;
  permissions: { action: string; subject: string }[];
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: { action: string; subject: string }[];
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: createRoleDto.name } });
    if (existing) throw new ConflictException(`Role ${createRoleDto.name} already exists`);

    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        permissions: {
          create: createRoleDto.permissions,
        },
      },
      include: { permissions: true }
    });
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: { permissions: true, _count: { select: { users: true } } },
      orderBy: { name: 'asc' }
    });
    return { data: roles, total: roles.length };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (role.name === 'SUPER_ADMIN') {
      throw new ConflictException('Cannot modify SUPER_ADMIN role');
    }

    if (updateRoleDto.permissions) {
      // Replace all permissions
      await this.prisma.permission.deleteMany({ where: { roleId: id } });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        permissions: updateRoleDto.permissions ? {
          create: updateRoleDto.permissions
        } : undefined
      },
      include: { permissions: true }
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    if (role.name === 'SUPER_ADMIN') throw new ConflictException('Cannot delete SUPER_ADMIN role');
    if (role._count.users > 0) throw new ConflictException('Cannot delete role with assigned users');

    await this.prisma.permission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }
}
