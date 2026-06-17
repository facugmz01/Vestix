import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // In frontend we are returning standard Authorization: Bearer token header or cookie?
    // Let's check headers first, then cookies if needed. For now assume Header:
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Customer token is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Customer token format invalid');
    }

    try {
      const payload = this.jwtService.verify(token);
      if (payload.role !== 'customer') {
        throw new UnauthorizedException('Invalid token role');
      }
      
      // Assign to request
      (request as any).user = payload;
    } catch (err) {
      throw new UnauthorizedException('Invalid customer token');
    }

    return true;
  }
}

@Injectable()
export class OptionalCustomerAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const payload = this.jwtService.verify(token);
          if (payload.role === 'customer') {
            (request as any).user = payload;
          }
        } catch (err) {
          // Ignore, guest checkout
        }
      }
    }

    return true; // Always allow
  }
}
