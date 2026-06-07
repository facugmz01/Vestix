import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel, TemplateKey } from '../notifications/models/notification.model';
import { StorefrontAuthGuard } from './storefront-auth.guard';

interface OtpEntry {
  code: string;
  expiresAt: Date;
  sentAt: Date;
  attempts: number;
}

/**
 * Storefront Customer Auth Controller
 * Handles WhatsApp OTP authentication for end-customers (NOT ERP admin users).
 * Issues a separate `storefront_token` cookie, independent of the admin `erp_token`.
 */
@Controller('storefront/auth')
export class StorefrontAuthController {
  private readonly logger = new Logger(StorefrontAuthController.name);

  // In-memory OTP store: phone → OTP entry
  // In production, replace with Redis for multi-instance support.
  private readonly otpStore = new Map<string, OtpEntry>();

  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000;   // 10 minutes
  private readonly RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds between resends
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Step 1 — Send OTP code via WhatsApp.
   * POST /storefront/auth/send-otp
   * Body: { phone: string }  — e.g. "5491122334455"
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() body: { phone: string }) {
    const phone = this.normalizePhone(body.phone);
    if (!phone) {
      throw new BadRequestException('Número de teléfono inválido.');
    }

    // Rate limiting: check if a code was sent recently
    const existing = this.otpStore.get(phone);
    if (existing) {
      const secondsSinceSent = (Date.now() - existing.sentAt.getTime()) / 1000;
      if (secondsSinceSent < this.RESEND_COOLDOWN_MS / 1000) {
        const waitSeconds = Math.ceil(this.RESEND_COOLDOWN_MS / 1000 - secondsSinceSent);
        throw new BadRequestException(
          `Esperá ${waitSeconds} segundos antes de solicitar un nuevo código.`,
        );
      }
    }

    // Generate a random 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store it in-memory
    this.otpStore.set(phone, {
      code,
      expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MS),
      sentAt: new Date(),
      attempts: 0,
    });

    // Dispatch WhatsApp notification (fire-and-forget)
    await this.notificationsService.enqueue({
      channel: NotificationChannel.WHATSAPP,
      templateKey: TemplateKey.OTP_CODE,
      recipient: phone,
      variables: { otpCode: code },
    });

    this.logger.log(`[OTP] Code sent to +${phone}`);

    return { success: true, message: 'Código enviado por WhatsApp.' };
  }

  /**
   * Step 2 — Verify OTP and issue session cookie.
   * POST /storefront/auth/verify-otp
   * Body: { phone: string, code: string }
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: { phone: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const phone = this.normalizePhone(body.phone);
    if (!phone || !body.code) {
      throw new BadRequestException('Teléfono y código son requeridos.');
    }

    const entry = this.otpStore.get(phone);

    if (!entry) {
      throw new UnauthorizedException('No hay código activo para este número. Solicitá uno nuevo.');
    }

    // Check expiry
    if (new Date() > entry.expiresAt) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException('El código expiró. Solicitá uno nuevo.');
    }

    // Track attempts
    entry.attempts += 1;

    if (entry.attempts > this.MAX_ATTEMPTS) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException('Demasiados intentos fallidos. Solicitá un nuevo código.');
    }

    if (entry.code !== body.code.trim()) {
      const remaining = this.MAX_ATTEMPTS - entry.attempts;
      throw new UnauthorizedException(
        `Código incorrecto. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`,
      );
    }

    // ✅ OTP is valid — clean up
    this.otpStore.delete(phone);

    // Find or create the customer
    let customer = await this.prisma.customer.findFirst({
      where: { phone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          fullName: `Cliente +${phone}`,
          phone,
          type: 'INDIVIDUAL',
        },
      });
      this.logger.log(`[OTP] New customer created: ${customer.id} (phone: +${phone})`);
    }

    // Issue JWT for the customer (separate from admin token)
    const payload = {
      sub: customer.id,
      phone: customer.phone,
      type: 'STOREFRONT_CUSTOMER',
    };
    const token = this.jwtService.sign(payload);

    // Set as a separate HttpOnly cookie
    res.cookie('storefront_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    this.logger.log(`[OTP] ✓ Customer ${customer.id} authenticated via WhatsApp OTP`);

    return {
      success: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      },
    };
  }

  /**
   * GET /storefront/auth/me — Returns current authenticated customer.
   * Protected by StorefrontAuthGuard.
   */
  @Get('me')
  @UseGuards(StorefrontAuthGuard)
  async getMe(@Req() req: Request) {
    const reqUser = (req as any).user;
    const customer = await this.prisma.customer.findUnique({
      where: { id: reqUser.customerId },
      select: { id: true, fullName: true, phone: true, email: true },
    });

    if (!customer) {
      throw new UnauthorizedException('Cliente no encontrado.');
    }

    return customer;
  }

  /**
   * POST /storefront/auth/logout — Clears the storefront_token cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('storefront_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { success: true, message: 'Sesión cerrada.' };
  }

  /**
   * Normalize phone to international format without '+'.
   * Accepts: "1122334455", "011 1234-5678", "549..." etc.
   */
  private normalizePhone(raw: string): string | null {
    if (!raw) return null;
    // Remove all non-digit characters
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) return null;

    // If already starts with 549 (Argentina mobile), use as-is
    if (digits.startsWith('549') && digits.length >= 12) return digits;

    // If starts with 54 but not 549
    if (digits.startsWith('54') && digits.length >= 11) return digits;

    // If starts with 0 (local format like 0111122334455), strip leading 0 and prepend 54
    if (digits.startsWith('0') && digits.length >= 10) {
      return '54' + digits.slice(1);
    }

    // Assume it's a local number without country code — prepend 549 (Argentina mobile)
    if (digits.length >= 8 && digits.length <= 11) {
      return '549' + digits;
    }

    return digits;
  }
}
