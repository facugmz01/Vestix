import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { StorefrontAuthService } from '../services/storefront-auth.service';
import { Response, Request } from 'express';

@Controller('storefront/auth')
export class StorefrontAuthController {
  constructor(private readonly authService: StorefrontAuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body('phone') phone: string) {
    return this.authService.requestOtp(phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('phone') phone: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.verifyOtp(phone, code);
    
    // Set HTTP-Only cookie for storefront session
    res.cookie('storefront_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return { success: true, customer: result.customer };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('storefront_token', { path: '/' });
    return { success: true };
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: Request) {
    // Basic verification of session
    const token = req.cookies?.['storefront_token'];
    if (!token) return { authenticated: false };
    // Real validation is done in Guards, but here we can just return basic state if needed.
    return { authenticated: true };
  }
}
