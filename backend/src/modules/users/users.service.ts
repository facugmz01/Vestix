import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 1. Ensure Superadmin Role exists
    const adminRole = await this.prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        permissions: {
          create: [
            { action: 'manage', subject: 'all' }
          ]
        }
      }
    });

    // 2. Ensure Admin User exists
    const adminEmail = 'admin@roindumentaria.com.ar';
    const adminExists = await this.prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          roleId: adminRole.id
        }
      });
      console.log('✅ Superadmin user created: admin@roindumentaria.com.ar / Admin123!');
    }
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password || 'DefaultPassword123!', 10); 

    const { branchId, role, ...userData } = createUserDto;

    let dbRole = await this.prisma.role.findUnique({ where: { name: role } });
    if (!dbRole) {
      // Auto-create role if it doesn't exist yet (useful for bootstrap)
      dbRole = await this.prisma.role.create({
        data: { name: role }
      });
    }
    
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
    });
  }

  async findAll({ page, pageSize }: { page: number; pageSize: number }) {
    const skip = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        include: {
          role: true,
          branch: true,
        },
        orderBy: { email: 'asc' },
      }),
      this.prisma.user.count(),
    ]);

    const formattedData = data.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role?.name || 'USER',
      branchId: u.branchId,
      isActive: u.isActive,
      lastLoginAt: u.updatedAt,
      createdAt: u.createdAt,
    }));

    return { data: formattedData, total, page, pageSize };
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
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ 
      where: { email },
      include: {
        role: {
          include: {
            permissions: true
          }
        },
        branch: true
      }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); 

    const { password, role, ...updateData } = updateUserDto as any;
    const data: any = { ...updateData };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      let dbRole = await this.prisma.role.findUnique({ where: { name: role } });
      if (!dbRole) {
        dbRole = await this.prisma.role.create({ data: { name: role } });
      }
      data.roleId = dbRole.id;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect(),
    });
  }

  async toggleActivation(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: this.userSelect(),
    });
  }

  async assignBranches(id: string, dto: AssignBranchesDto) {
    // Currently User model supports only one branchId (as seen in POS logic)
    // If multi-branch is needed, we would need a join table.
    // For now, we take the first one or clear it.
    return this.prisma.user.update({
      where: { id },
      data: { branchId: dto.branchIds[0] || null },
      select: this.userSelect(),
    });
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
}
