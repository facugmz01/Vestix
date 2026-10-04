import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      generateToken: jest.fn(),
      generateMfaPendingToken: jest.fn(),
      verifyMfaPendingToken: jest.fn(),
      verifyMfaLogin: jest.fn(),
      getUserById: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      generateMfa: jest.fn(),
      enableMfa: jest.fn(),
      disableMfa: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should return mfaRequired and mfaToken if user has MFA enabled during login', async () => {
    authService.validateUser.mockResolvedValueOnce({
      user: {
        id: 'u-1',
        email: 'admin@vestix.com',
        mfaEnabled: true,
      },
    });
    authService.generateMfaPendingToken.mockReturnValueOnce('mfa-temp-jwt');

    const mockRes: any = { cookie: jest.fn() };
    const res = await controller.login(
      { email: 'admin@vestix.com', password: 'Password123!' },
      mockRes,
    );

    expect(res.mfaRequired).toBe(true);
    expect(res.mfaToken).toBe('mfa-temp-jwt');
    expect(mockRes.cookie).not.toHaveBeenCalled();
  });

  it('should perform standard login and set cookie if user does NOT have MFA enabled', async () => {
    authService.validateUser.mockResolvedValueOnce({
      user: {
        id: 'u-1',
        email: 'admin@vestix.com',
        fullName: 'Admin User',
        mfaEnabled: false,
        role: { name: 'SUPER_ADMIN', permissions: [] },
      },
    });
    authService.generateToken.mockResolvedValueOnce('session-jwt');

    const mockRes: any = { cookie: jest.fn() };
    const res = await controller.login(
      { email: 'admin@vestix.com', password: 'Password123!' },
      mockRes,
    );

    expect(res.message).toBe('Login exitoso');
    expect(res.user.email).toBe('admin@vestix.com');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'erp_token',
      'session-jwt',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should verify MFA login and set cookie', async () => {
    authService.verifyMfaPendingToken.mockReturnValueOnce({ sub: 'u-1', email: 'admin@vestix.com' });
    authService.verifyMfaLogin.mockResolvedValueOnce({
      id: 'u-1',
      email: 'admin@vestix.com',
      fullName: 'Admin User',
      mfaEnabled: true,
      role: { name: 'SUPER_ADMIN', permissions: [] },
    });
    authService.generateToken.mockResolvedValueOnce('session-jwt');

    const mockRes: any = { cookie: jest.fn() };
    const res = await controller.loginMfa(
      { mfaToken: 'mfa-temp-jwt', code: '123456' },
      mockRes,
    );

    expect(res.message).toBe('Login exitoso');
    expect(res.user.mfaEnabled).toBe(true);
    expect(mockRes.cookie).toHaveBeenCalledWith('erp_token', 'session-jwt', expect.any(Object));
  });

  it('should update profile via controller', async () => {
    authService.updateProfile.mockResolvedValueOnce({
      id: 'u-1',
      email: 'updated@vestix.com',
      fullName: 'Updated Name',
      phone: '12345678',
      mfaEnabled: false,
      role: 'SUPER_ADMIN',
    });

    const mockReq: any = { user: { userId: 'u-1' } };
    const res = await controller.updateProfile(mockReq, {
      fullName: 'Updated Name',
      phone: '12345678',
    });

    expect(res.message).toBe('Perfil actualizado correctamente');
    expect(res.user.fullName).toBe('Updated Name');
    expect(res.user.phone).toBe('12345678');
  });
});
