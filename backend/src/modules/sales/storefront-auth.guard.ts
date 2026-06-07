import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard that protects storefront-specific endpoints.
 * Uses the 'storefront-jwt' Passport strategy which reads from the `storefront_token` cookie.
 */
@Injectable()
export class StorefrontAuthGuard extends AuthGuard('storefront-jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
