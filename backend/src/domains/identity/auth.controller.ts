import { Controller, Post, Body, Res, HttpCode, HttpStatus, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.validateUser(loginDto.email, loginDto.password);
    const token = await this.authService.generateToken(result.user);

    res.cookie('erp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    });

    return { 
      message: 'Login exitoso', 
      user: this.transformUser(result.user) 
    };
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('erp_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
      branchId: user.branchId,
      role: roleName,
      permissions,
    };
  }
}
