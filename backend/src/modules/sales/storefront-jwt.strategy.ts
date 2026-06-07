import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * JWT Strategy for storefront customer authentication.
 * Uses a SEPARATE cookie (`storefront_token`) from the admin `erp_token`.
 * Only validates tokens with type = 'STOREFRONT_CUSTOMER'.
 */
@Injectable()
export class StorefrontJwtStrategy extends PassportStrategy(Strategy, 'storefront-jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.storefront_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
    });
  }

  async validate(payload: any) {
    // Ensure this is a storefront customer token, not an admin token
    if (payload.type !== 'STOREFRONT_CUSTOMER') {
      throw new UnauthorizedException('Token de tipo inválido para la tienda.');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
    });

    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Sesión de cliente inválida o eliminada.');
    }

    // Return what will be attached to req.user
    return {
      customerId: customer.id,
      phone: customer.phone,
      fullName: customer.fullName,
      email: customer.email,
    };
  }
}
