import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignBranchesDto } from './dto/assign-branches.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DisableMfaDto } from './dto/mfa.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  generateTotpSecret,
  verifyTotpToken,
  buildOtpauthUrl,
  generateQrCodeDataUrl,
  generateBackupCodes,
} from './totp.util';

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
        phone: userData.phone || null,
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

    if ('phone' in updateUserDto) {
      data.phone = updateUserDto.phone || null;
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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const data: any = {};

    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName.trim();
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone ? dto.phone.trim() : null;
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const targetEmail = dto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findUnique({ where: { email: targetEmail } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }
      data.email = targetEmail;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.userSelect(),
    });

    return this.formatUser(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (dto.newPassword.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Contraseña actualizada correctamente' };
  }

  async generateMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const secret = generateTotpSecret();
    const otpauthUrl = buildOtpauthUrl(user.email, secret, 'Vestix');
    const qrCode = await generateQrCodeDataUrl(otpauthUrl);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaPendingSecret: secret },
    });

    return {
      secret,
      otpauthUrl,
      qrCode,
    };
  }

  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.mfaPendingSecret) {
      throw new BadRequestException('No hay una configuración de MFA pendiente. Generá un nuevo código QR.');
    }

    const isValid = verifyTotpToken(code, user.mfaPendingSecret);
    if (!isValid) {
      throw new BadRequestException('El código de verificación es inválido o ha expirado. Verificá la hora de tu dispositivo.');
    }

    const backupCodes = generateBackupCodes(8);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: user.mfaPendingSecret,
        mfaPendingSecret: null,
        mfaBackupCodes: backupCodes,
      },
    });

    return {
      success: true,
      message: 'Autenticación de dos factores (MFA) activada con éxito',
      backupCodes,
    };
  }

  async disableMfa(userId: string, dto: DisableMfaDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('La contraseña ingresada es incorrecta');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaBackupCodes: [],
      },
    });

    return {
      success: true,
      message: 'Autenticación de dos factores (MFA) desactivada correctamente',
    };
  }

  async verifyMfaLogin(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        branch: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inválido o inactivo');
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA no está configurado para esta cuenta');
    }

    // Check TOTP code
    const isTotpValid = verifyTotpToken(code, user.mfaSecret);
    if (isTotpValid) {
      return user;
    }

    // Check backup codes
    const cleanCode = code.trim().toUpperCase();
    if (user.mfaBackupCodes && user.mfaBackupCodes.includes(cleanCode)) {
      // Consume backup code
      const remaining = user.mfaBackupCodes.filter((c) => c !== cleanCode);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { mfaBackupCodes: remaining },
      });
      return user;
    }

    throw new UnauthorizedException('Código de verificación incorrecto o expirado');
  }

  private userSelect() {
    return {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      roleId: true,
      branchId: true,
      isActive: true,
      mfaEnabled: true,
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
      phone: u.phone,
      role: u.role?.name || 'USER',
      branchId: u.branchId,
      branchName: u.branch?.name,
      isActive: u.isActive,
      mfaEnabled: u.mfaEnabled ?? false,
      createdAt: u.createdAt,
    };
  }

  private formatUser(u: any) {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role?.name || 'USER',
      branchId: u.branchId,
      branchName: u.branch?.name,
      isActive: u.isActive,
      mfaEnabled: u.mfaEnabled ?? false,
      createdAt: u.createdAt,
    };
  }

  private formatUserDetail(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role?.name || 'USER',
      branchId: user.branchId,
      branchName: user.branch?.name,
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled ?? false,
      createdAt: user.createdAt,
      permissions: user.role?.permissions || [],
    };
  }
}
