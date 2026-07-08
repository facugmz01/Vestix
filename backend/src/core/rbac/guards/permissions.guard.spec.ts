import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { RbacService } from '../rbac.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  const validateUserPermissions = jest.fn(
    async (_roleId: string, _required: unknown[]) => true,
  );
  const rbacService = { validateUserPermissions } as unknown as RbacService;

  const buildContext = (user?: object) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector, rbacService);
  });

  it('allows public routes without permission metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
    expect(validateUserPermissions).not.toHaveBeenCalled();
  });

  it('denies when route lacks permission metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    await expect(guard.canActivate(buildContext({ roleId: 'r1' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('validates permissions for authenticated users', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === PERMISSIONS_KEY) return [{ action: 'read', subject: 'Users' }];
      return undefined;
    });
    validateUserPermissions.mockResolvedValue(true);

    await expect(
      guard.canActivate(buildContext({ userId: 'u1', roleId: 'r1' })),
    ).resolves.toBe(true);

    expect(validateUserPermissions).toHaveBeenCalledWith('r1', [
      { action: 'read', subject: 'Users' },
    ]);
  });
});
