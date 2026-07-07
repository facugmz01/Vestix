import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { isSystemRole } from './constants/system-roles';

export interface CreateRoleDto {
  name: string;
  permissions: { action: string; subject: string }[];
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: { action: string; subject: string }[];
}

export interface RoleListFilters {
  page: number;
  pageSize: number;
  search?: string;
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: createRoleDto.name } });
    if (existing) throw new ConflictException(`Role ${createRoleDto.name} already exists`);

    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        permissions: {
          create: createRoleDto.permissions,
        },
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    return this.formatRole(role);
  }

  async findAll(filters: RoleListFilters) {
    const { page, pageSize, search } = filters;
    const skip = (page - 1) * pageSize;

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: pageSize,
        include: { permissions: true, _count: { select: { users: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data: roles.map((r) => this.formatRole(r)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true, _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    return this.formatRole(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    if (role.name === 'SUPER_ADMIN') {
      throw new ConflictException('Cannot modify SUPER_ADMIN role');
    }

    if (updateRoleDto.permissions) {
      await this.prisma.permission.deleteMany({ where: { roleId: id } });
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        permissions: updateRoleDto.permissions
          ? { create: updateRoleDto.permissions }
          : undefined,
      },
      include: { permissions: true, _count: { select: { users: true } } },
    });

    return this.formatRole(updated);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);
    if (role.name === 'SUPER_ADMIN') throw new ConflictException('Cannot delete SUPER_ADMIN role');
    if (isSystemRole(role.name)) {
      throw new ConflictException('Cannot delete a system role');
    }
    if (role._count.users > 0) {
      throw new ConflictException('Cannot delete role with assigned users');
    }

    await this.prisma.permission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  private formatRole(role: any) {
    return {
      id: role.id,
      name: role.name,
      isSystem: isSystemRole(role.name),
      permissions: role.permissions || [],
      userCount: role._count?.users ?? 0,
    };
  }
}
