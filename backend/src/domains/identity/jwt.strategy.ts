import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      // Custom extractor to pull the token from the cookie instead of the Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.erp_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
    });
  }

  async validate(payload: any) {
    // Check if user still exists and hasn't been hard-deleted
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      throw new UnauthorizedException('User session invalid or deleted.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado. Contactá al administrador.');
    }

    // Attach user to Request object for the PermissionsGuard to consume
    return { userId: payload.sub, email: payload.email, roleId: user.roleId };
  }
}
