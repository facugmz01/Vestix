import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

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

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      // Legacy check for plain text passwords (remove once migrated)
      if (user.password === pass) return { user };
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

  async getAdminUser() {
    return this.usersService.findByEmail('admin@roindumentaria.com.ar');
  }
}
