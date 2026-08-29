import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface UserListFilters {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        permissions: {
          create: [{ action: 'manage', subject: 'all' }],
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    if (!createUserDto.password || createUserDto.password.length < 8) {
      throw new BadRequestException('La contraseña es obligatoria y debe tener al menos 8 caracteres');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const { branchId, role, ...userData } = createUserDto;

    const dbRole = await this.resolveRole(role);

    return this.prisma.user.create({
      data: {
        email: userData.email,
        fullName: userData.fullName,
        roleId: dbRole.id,
        branchId: branchId,
        password: hashedPassword,
        isActive: userData.isActive ?? true,
      },
      select: this.userSelect(),
    }).then((user) => this.formatUser(user));
  }

  async findAll(filters: UserListFilters) {
    const { page, pageSize, search, role, isActive } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          role: true,
          branch: true,
        },
        orderBy: { email: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u) => this.formatUserListItem(u)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: true } },
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.formatUserDetail(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        branch: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existing = await this.findOne(id);

    const { password, role, email, ...updateData } = updateUserDto as any;
    const data: any = { ...updateData };

    if (email && email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }
      data.email = email;
    }

    if (password) {
      if (password.length < 8) {
        throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
      }
      data.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      const dbRole = await this.resolveRole(role);
      data.roleId = dbRole.id;
    }

    if ('branchId' in updateUserDto) {
      data.branchId = updateUserDto.branchId || null;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect(),
    });

    return this.formatUser(user);
  }

  async remove(id: string, requestingUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (requestingUserId && requestingUserId === id) {
      throw new BadRequestException('No podés eliminar tu propio usuario');
    }

    if (user.role?.name === 'SUPER_ADMIN') {
      const superAdminRole = await this.prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
      if (superAdminRole) {
        const superAdminCount = await this.prisma.user.count({ where: { roleId: superAdminRole.id } });
        if (superAdminCount <= 1) {
          throw new ConflictException('No se puede eliminar el único Super Admin del sistema');
        }
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async toggleActivation(id: string, isActive: boolean) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: this.userSelect(),
    });

    return this.formatUser(user);
  }

  async assignBranches(id: string, dto: AssignBranchesDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { branchId: dto.branchIds[0] || null },
      select: this.userSelect(),
    });

    return this.formatUser(user);
  }

  private async resolveRole(roleName: string) {
    const dbRole = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!dbRole) {
      throw new BadRequestException(`El rol "${roleName}" no existe. Creá el rol antes de asignarlo.`);
    }
    return dbRole;
  }

  private userSelect() {
    return {
      id: true,
      email: true,
      fullName: true,
      roleId: true,
      branchId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      branch: true,
    };
  }

  private formatUserListItem(u: any) {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role?.name || 'USER',
      branchId: u.branchId,
      branchName: u.branch?.name,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  }

  private formatUser(u: any) {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role?.name || 'USER',
      branchId: u.branchId,
      branchName: u.branch?.name,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  }

  private formatUserDetail(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role?.name || 'USER',
      branchId: user.branchId,
      branchName: user.branch?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      permissions: user.role?.permissions || [],
    };
  }
}
