import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookieOrHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super_secret_dev_key',
      });
      
      if (payload.type !== 'CUSTOMER') {
        throw new UnauthorizedException('Invalid token type');
      }

      // We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      (request as any).customer = {
        id: payload.sub,
        phone: payload.phone,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromCookieOrHeader(request: Request): string | undefined {
    // 1. Try cookie
    const token = request.cookies?.['storefront_token'];
    if (token) return token;

    // 2. Try Authorization header
    const [type, headerToken] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? headerToken : undefined;
  }
}
