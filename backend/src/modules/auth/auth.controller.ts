import { Controller, Post, Body, Res, HttpCode, HttpStatus, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
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

    return this.transformUser(result.user);
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = await this.authService.getAdminUser();
    if (!user) throw new UnauthorizedException();
    
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
    return {
      id: user.id,
      email: user.email,
      role: user.role?.name || 'USER',
      permissions: user.role?.permissions || []
    };
  }
}
