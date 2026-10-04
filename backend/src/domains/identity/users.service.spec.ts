import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { generateTotpToken } from './totp.util';

describe('UsersService - Profile & MFA', () => {
  let service: UsersService;
  let prisma: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'user@test.com',
    fullName: 'Test User',
    phone: '1122334455',
    password: '',
    roleId: 'role-1',
    branchId: null,
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,
    mfaPendingSecret: null,
    mfaBackupCodes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    role: { id: 'role-1', name: 'ADMIN', permissions: [] },
    branch: null,
  };

  beforeAll(async () => {
    mockUser.password = await bcrypt.hash('OldPassword123!', 10);
  });

  beforeEach(async () => {
    prisma = {
      role: {
        upsert: jest.fn().mockResolvedValue({ id: 'role-super', name: 'SUPER_ADMIN' }),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('updateProfile', () => {
    it('should successfully update name and phone', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...mockUser });
      prisma.user.update.mockResolvedValueOnce({
        ...mockUser,
        fullName: 'New Name',
        phone: '99887766',
      });

      const result = await service.updateProfile('user-uuid-1', {
        fullName: 'New Name',
        phone: '99887766',
      });

      expect(result.fullName).toBe('New Name');
      expect(result.phone).toBe('99887766');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            fullName: 'New Name',
            phone: '99887766',
          }),
        }),
      );
    });

    it('should throw ConflictException if updated email already belongs to another user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ ...mockUser }) // find current user
        .mockResolvedValueOnce({ id: 'user-uuid-2', email: 'taken@test.com' }); // find existing email user

      await expect(
        service.updateProfile('user-uuid-1', { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password when current password matches', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...mockUser });
      prisma.user.update.mockResolvedValueOnce({ ...mockUser });

      const result = await service.changePassword('user-uuid-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'BrandNewPassword123!',
      });

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            password: expect.any(String),
          }),
        }),
      );
    });

    it('should reject when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...mockUser });

      await expect(
        service.changePassword('user-uuid-1', {
          currentPassword: 'WrongPassword!',
          newPassword: 'BrandNewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when new password is identical to current password', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...mockUser });

      await expect(
        service.changePassword('user-uuid-1', {
          currentPassword: 'OldPassword123!',
          newPassword: 'OldPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('MFA Setup and Verification', () => {
    it('should generate MFA secret and QR code data URL', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...mockUser });
      prisma.user.update.mockResolvedValueOnce({ ...mockUser });

      const res = await service.generateMfa('user-uuid-1');

      expect(res.secret).toBeDefined();
      expect(res.otpauthUrl).toContain('otpauth://totp/');
      expect(res.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { mfaPendingSecret: res.secret },
        }),
      );
    });

    it('should enable MFA when provided a valid code for the pending secret', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const validCode = generateTotpToken(secret);

      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        mfaPendingSecret: secret,
      });
      prisma.user.update.mockResolvedValueOnce({ ...mockUser, mfaEnabled: true });

      const res = await service.enableMfa('user-uuid-1', validCode);

      expect(res.success).toBe(true);
      expect(res.backupCodes).toHaveLength(8);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            mfaEnabled: true,
            mfaSecret: secret,
            mfaPendingSecret: null,
            mfaBackupCodes: expect.any(Array),
          }),
        }),
      );
    });

    it('should reject enabling MFA when code is invalid', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        mfaPendingSecret: 'JBSWY3DPEHPK3PXP',
      });

      await expect(service.enableMfa('user-uuid-1', '000000')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should disable MFA with correct password', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'SECRET',
      });
      prisma.user.update.mockResolvedValueOnce({ ...mockUser, mfaEnabled: false });

      const res = await service.disableMfa('user-uuid-1', {
        password: 'OldPassword123!',
      });

      expect(res.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: {
            mfaEnabled: false,
            mfaSecret: null,
            mfaPendingSecret: null,
            mfaBackupCodes: [],
          },
        }),
      );
    });

    it('should verify MFA login with valid TOTP code or backup code', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const validCode = generateTotpToken(secret);

      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: ['BACK-UP01'],
      });

      const user = await service.verifyMfaLogin('user-uuid-1', validCode);
      expect(user.id).toBe('user-uuid-1');

      // Test backup code usage
      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: ['BACK-UP01', 'BACK-UP02'],
      });
      prisma.user.update.mockResolvedValueOnce({});

      const userWithBackup = await service.verifyMfaLogin('user-uuid-1', 'BACK-UP01');
      expect(userWithBackup.id).toBe('user-uuid-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { mfaBackupCodes: ['BACK-UP02'] },
      });
    });
  });
});
