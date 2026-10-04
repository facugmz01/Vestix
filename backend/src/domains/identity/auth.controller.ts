import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { isCookieSecure } from '../../core/http/cookie-options';

import { AuthorizeActionDto } from './dto/authorize-action.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyMfaDto, DisableMfaDto, LoginMfaDto } from './dto/mfa.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (result.user.mfaEnabled) {
      const mfaToken = this.authService.generateMfaPendingToken(result.user);
      return {
        mfaRequired: true,
        mfaToken,
        message: 'Se requiere código de verificación de dos factores (MFA)',
      };
    }

    const token = await this.authService.generateToken(result.user);

    res.cookie('erp_token', token, {
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    });

    return { 
      message: 'Login exitoso', 
      user: this.transformUser(result.user) 
    };
  }

  @Post('login-mfa')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async loginMfa(@Body() dto: LoginMfaDto, @Res({ passthrough: true }) res: Response) {
    const payload = this.authService.verifyMfaPendingToken(dto.mfaToken);
    const user = await this.authService.verifyMfaLogin(payload.sub, dto.code);
    const token = await this.authService.generateToken(user);

    res.cookie('erp_token', token, {
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return {
      message: 'Login exitoso',
      user: this.transformUser(user),
    };
  }

  @Post('authorize-action')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async authorizeAction(@Body() dto: AuthorizeActionDto) {
    return this.authService.authorizeSupervisorAction(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request) {
    // req.user is set by the JwtStrategy if the token is valid
    const reqUser = (req as any).user;
    if (!reqUser) throw new UnauthorizedException();
    
    // Fetch fresh user data from DB to get latest permissions/roles
    const user = await this.authService.getUserById(reqUser.userId);
    if (!user) throw new UnauthorizedException();
    if (user.isActive === false) throw new UnauthorizedException('Usuario desactivado');
    
    return this.transformUser(user);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const reqUser = (req as any).user;
    if (!reqUser) throw new UnauthorizedException();
    const updated = await this.authService.updateProfile(reqUser.userId, dto);
    return {
      message: 'Perfil actualizado correctamente',
      user: this.transformUser(updated),
    };
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const reqUser = (req as any).user;
    if (!reqUser) throw new UnauthorizedException();
    return this.authService.changePassword(reqUser.userId, dto);
  }

  @Post('mfa/generate')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async generateMfa(@Req() req: Request) {
    const reqUser = (req as any).user;
    if (!reqUser) throw new UnauthorizedException();
    return this.authService.generateMfa(reqUser.userId);
  }

  @Post('mfa/enable')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async enableMfa(@Req() req: Request, @Body() dto: VerifyMfaDto) {
    const reqUser = (req as any).user;
    if (!reqUser) throw new UnauthorizedException();
    return this.authService.enableMfa(reqUser.userId, dto.code);
  }

  @Post('mfa/disable')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async disableMfa(@Req() req: Request, @Body() dto: DisableMfaDto) {
    const reqUser = (req as any).user;
    if (!reqUser) throw new UnauthorizedException();
    return this.authService.disableMfa(reqUser.userId, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('erp_token', {
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: 'strict',
    });
    return { message: 'Logged out' };
  }

  private transformUser(user: any) {
    const roleName =
      typeof user.role === 'string' ? user.role : user.role?.name || 'USER';
    const permissions = user.permissions ?? user.role?.permissions ?? [];

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || null,
      branchId: user.branchId,
      role: roleName,
      permissions,
      mfaEnabled: user.mfaEnabled ?? false,
    };
  }
}
