import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional storefront auth — attaches req.user when a valid storefront_token
 * cookie is present, but does not reject unauthenticated requests.
 */
@Injectable()
export class StorefrontOptionalAuthGuard extends AuthGuard('storefront-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch {
      return true;
    }
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      return null as TUser;
    }
    return user;
  }
}
