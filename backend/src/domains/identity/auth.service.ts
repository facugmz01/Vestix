import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { AuthorizeActionDto } from './dto/authorize-action.dto';
import { roleHasPermissions } from '../../core/rbac/permission-match.util';
import * as bcrypt from 'bcrypt';

export interface SupervisorApprovalPayload {
  type: 'SUPERVISOR_APPROVAL';
  supervisorId: string;
  supervisorEmail: string;
  supervisorName: string;
  action: string;
  subject?: string;
  reason?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado. Contactá al administrador.');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    return { user };
  }

  async generateToken(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role?.name || 'USER',
      permissions: user.role?.permissions || []
    };
    return this.jwtService.sign(payload);
  }

  async authorizeSupervisorAction(dto: AuthorizeActionDto) {
    const { user } = await this.validateUser(dto.email, dto.password);
    const roleName = user.role?.name || '';
    const permissions = user.role?.permissions || [];

    // Parse action & subject
    let requiredAction = dto.action;
    let requiredSubject = dto.subject || 'Sales';

    if (dto.action.includes(':')) {
      const parts = dto.action.split(':');
      requiredAction = parts[0];
      requiredSubject = parts[1];
    }

    const isSuperAdmin = roleName === 'SUPER_ADMIN';
    const isStoreManager = roleName === 'STORE_MANAGER';
    const hasPermission = roleHasPermissions(permissions, [{ action: requiredAction, subject: requiredSubject }]);

    if (!isSuperAdmin && !isStoreManager && !hasPermission) {
      throw new ForbiddenException(
        `El usuario ${user.fullName || user.email} no tiene permisos de supervisor para autorizar '${dto.action}'`,
      );
    }

    const approvalPayload: SupervisorApprovalPayload = {
      type: 'SUPERVISOR_APPROVAL',
      supervisorId: user.id,
      supervisorEmail: user.email,
      supervisorName: user.fullName || user.email,
      action: dto.action,
      subject: requiredSubject,
      reason: dto.reason,
    };

    const supervisorApprovalToken = this.jwtService.sign(approvalPayload, { expiresIn: '5m' });

    return {
      message: 'Acción autorizada por supervisor',
      supervisorApprovalToken,
      supervisor: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: roleName,
      },
    };
  }

  verifyApprovalToken(token: string, expectedAction?: string): SupervisorApprovalPayload {
    try {
      const payload = this.jwtService.verify<SupervisorApprovalPayload>(token);
      if (!payload || payload.type !== 'SUPERVISOR_APPROVAL') {
        throw new BadRequestException('Token de autorización de supervisor inválido');
      }

      if (expectedAction) {
        const normExpected = expectedAction.toLowerCase();
        const normAction = (payload.action || '').toLowerCase();
        // Allow general supervisor action or exact match
        const isMatch = normAction === normExpected ||
          normAction === 'manage:sales' ||
          normAction === 'manage:all' ||
          (normExpected.includes('discount') && normAction.includes('discount')) ||
          (normExpected.includes('price') && normAction.includes('price'));

        if (!isMatch) {
          throw new BadRequestException(`El token provisto no autoriza la acción requerida '${expectedAction}'`);
        }
      }

      return payload;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new UnauthorizedException('Token de autorización de supervisor expirado o no válido');
    }
  }

  async getAdminUser() {
    return this.usersService.findByEmail('admin@roindumentaria.com.ar');
  }

  async getUserById(id: string) {
    return this.usersService.findOne(id);
  }
}

