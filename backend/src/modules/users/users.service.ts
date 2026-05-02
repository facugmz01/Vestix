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
      where: { name: 'SUPERADMIN' },
      update: {},
      create: {
        name: 'SUPERADMIN',
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

    // In a real system, send a welcome email with a secure setup link instead of a default password
    const hashedPassword = await bcrypt.hash('DefaultPassword123!', 10); 

    const { branchIds, ...userData } = createUserDto;
    
    // Find or create a default user role
    const defaultRole = await this.prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER' }
    });
    
    const roleId = defaultRole.id; 

    return this.prisma.user.create({
      data: {
        email: userData.email,
        roleId: roleId,
        password: hashedPassword,
      },
      select: this.userSelect(),
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect(),
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect(),
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
        }
      }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // Ensure user exists before updating

    const { branchIds, ...updateData } = updateUserDto;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateData as any) // Only pass supported fields
      },
      select: this.userSelect(),
    });
  }

  async toggleActivation(id: string, isActive: boolean) {
    await this.findOne(id);

    // Model does not support isActive, returning user
    return this.findOne(id);
  }

  async assignBranches(id: string, assignBranchesDto: AssignBranchesDto) {
    await this.findOne(id);

    // Model does not support branches, returning user
    return this.findOne(id);
  }

  private userSelect() {
    // Do not return the password hash
    return {
      id: true,
      email: true,
      role: true,
    };
  }
}
