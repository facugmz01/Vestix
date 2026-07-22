import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRateLimitService } from '../notifications/notification-rate-limit.service';
import { NotificationChannel, TemplateKey } from '../notifications/models/notification.model';
import { SettingsService } from '../../modules/settings/settings.service';
import {
  getStoreLoginChannels,
  resolveRecipient,
} from '../notifications/utils/notification-channels.util';
import { StorefrontAuthGuard } from './storefront-auth.guard';
import { RedisService } from '../../core/redis/redis.service';
import { UpdateStorefrontProfileDto } from './dto/update-storefront-profile.dto';
import { toStorefrontCustomerResponse } from './storefront-customer.util';
import { StorefrontCustomerIdentityService } from './storefront-customer-identity.service';
import { isCookieSecure } from '../../core/http/cookie-options';

interface OtpEntry {
  code: string;
  expiresAt: Date;
  sentAt: Date;
  attempts: number;
}

type OtpIdentifierType = 'phone' | 'email';

interface OtpIdentifier {
  type: OtpIdentifierType;
  value: string;
  contact: { phone?: string; email?: string };
}

/**
 * Storefront Customer Auth Controller
 * Handles OTP authentication for end-customers (NOT ERP admin users).
 * Issues a separate `storefront_token` cookie, independent of the admin `erp_token`.
 */
@Controller('storefront/auth')
export class StorefrontAuthController {
  private readonly logger = new Logger(StorefrontAuthController.name);

  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000;   // 10 minutes
  private readonly RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds between resends
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: NotificationRateLimitService,
    private readonly settingsService: SettingsService,
    private readonly customerIdentity: StorefrontCustomerIdentityService,
  ) {}

  private otpRedisKey(identifier: OtpIdentifier): string {
    return `otp:${identifier.type}:${identifier.value}`;
  }

  private rateLimitSubject(identifier: OtpIdentifier): string {
    return `${identifier.type}:${identifier.value}`;
  }

  private async getOtp(identifier: OtpIdentifier): Promise<OtpEntry | null> {
    const redis = this.redisService.getClient();
    const data = await redis.get(this.otpRedisKey(identifier));
    if (!data) return null;
    const entry = JSON.parse(data);
    return {
      code: entry.code,
      expiresAt: new Date(entry.expiresAt),
      sentAt: new Date(entry.sentAt),
      attempts: entry.attempts,
    };
  }

  private async setOtp(identifier: OtpIdentifier, entry: OtpEntry): Promise<void> {
    const redis = this.redisService.getClient();
    const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAt.getTime() - Date.now()) / 1000));
    await redis.set(this.otpRedisKey(identifier), JSON.stringify(entry), 'EX', ttlSeconds);
  }

  private async deleteOtp(identifier: OtpIdentifier): Promise<void> {
    const redis = this.redisService.getClient();
    await redis.del(this.otpRedisKey(identifier));
  }

  private async resolveLoginIdentifier(
    body: { phone?: string; email?: string },
    loginChannels: NotificationChannel[],
  ): Promise<OtpIdentifier> {
    const primaryChannel = loginChannels[0] ?? NotificationChannel.WHATSAPP;

    if (primaryChannel === NotificationChannel.EMAIL) {
      const email = this.normalizeEmail(body.email ?? '');
      if (!email) {
        throw new BadRequestException('Correo electrónico inválido.');
      }
      return { type: 'email', value: email, contact: { email } };
    }

    const phone = this.normalizePhone(body.phone ?? '');
    if (!phone) {
      throw new BadRequestException('Número de teléfono inválido.');
    }
    return { type: 'phone', value: phone, contact: { phone } };
  }

  /**
   * Step 1 — Send OTP code via configured store-login channel.
   * POST /storefront/auth/send-otp
   * Body: { phone?: string, email?: string }
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() body: { phone?: string; email?: string }, @Req() req: Request) {
    const storefrontSettings = await this.settingsService.getStorefrontSettings();
    const loginChannels = getStoreLoginChannels(storefrontSettings);
    const identifier = await this.resolveLoginIdentifier(body, loginChannels);

    const clientIp = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
    await this.rateLimitService.assertOtpAllowed(this.rateLimitSubject(identifier), clientIp);

    const existing = await this.getOtp(identifier);
    if (existing) {
      const secondsSinceSent = (Date.now() - existing.sentAt.getTime()) / 1000;
      if (secondsSinceSent < this.RESEND_COOLDOWN_MS / 1000) {
        const waitSeconds = Math.ceil(this.RESEND_COOLDOWN_MS / 1000 - secondsSinceSent);
        throw new BadRequestException(
          `Esperá ${waitSeconds} segundos antes de solicitar un nuevo código.`,
        );
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await this.setOtp(identifier, {
      code,
      expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MS),
      sentAt: new Date(),
      attempts: 0,
    });

    let sent = false;
    let sentChannel: NotificationChannel | null = null;

    for (const channel of loginChannels) {
      const recipient = resolveRecipient(
        channel,
        identifier.contact,
        (value) => this.normalizePhone(value),
      );
      if (!recipient) continue;

      const job = await this.notificationsService.enqueue({
        channel,
        templateKey: TemplateKey.OTP_CODE,
        recipient,
        variables: { otpCode: code },
      });

      if (job) {
        sent = true;
        sentChannel = channel;
        break;
      }
    }

    if (!sent) {
      throw new BadRequestException(
        'No se pudo enviar el código. Verificá que el canal de login esté habilitado y configurado en Ajustes → Notificaciones.',
      );
    }

    const channelLabel = sentChannel === NotificationChannel.SMS
      ? 'SMS'
      : sentChannel === NotificationChannel.EMAIL
        ? 'correo electrónico'
        : 'WhatsApp';

    const targetLabel = identifier.type === 'email'
      ? identifier.value
      : `+${identifier.value}`;

    this.logger.log(`[OTP] Code sent to ${targetLabel} via ${sentChannel}`);

    return { success: true, message: `Código enviado por ${channelLabel}.` };
  }

  /**
   * Step 2 — Verify OTP and issue session cookie.
   * POST /storefront/auth/verify-otp
   * Body: { phone?: string, email?: string, code: string }
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: { phone?: string; email?: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.code) {
      throw new BadRequestException('El código es requerido.');
    }

    const storefrontSettings = await this.settingsService.getStorefrontSettings();
    const loginChannels = getStoreLoginChannels(storefrontSettings);
    const identifier = await this.resolveLoginIdentifier(body, loginChannels);

    const entry = await this.getOtp(identifier);

    if (!entry) {
      const label = identifier.type === 'email' ? 'este correo' : 'este número';
      throw new UnauthorizedException(`No hay código activo para ${label}. Solicitá uno nuevo.`);
    }

    if (new Date() > entry.expiresAt) {
      await this.deleteOtp(identifier);
      throw new UnauthorizedException('El código expiró. Solicitá uno nuevo.');
    }

    entry.attempts += 1;

    if (entry.attempts > this.MAX_ATTEMPTS) {
      await this.deleteOtp(identifier);
      throw new UnauthorizedException('Demasiados intentos fallidos. Solicitá un nuevo código.');
    }

    if (entry.code !== body.code.trim()) {
      await this.setOtp(identifier, entry);
      const remaining = this.MAX_ATTEMPTS - entry.attempts;
      throw new UnauthorizedException(
        `Código incorrecto. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`,
      );
    }

    await this.deleteOtp(identifier);

    let customer = await this.customerIdentity.findByIdentifier(identifier);

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          fullName: identifier.type === 'email'
            ? identifier.value.split('@')[0]
            : `Cliente +${identifier.value}`,
          phone: identifier.type === 'phone' ? identifier.value : null,
          email: identifier.type === 'email' ? identifier.value : null,
          type: 'INDIVIDUAL',
          source: 'STOREFRONT',
        },
      });
      this.logger.log(`[OTP] New customer created: ${customer.id}`);
    } else if (customer.source !== 'STOREFRONT' && customer.source !== 'ADMIN') {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { source: 'STOREFRONT' },
      });
    }

    // Link guest checkouts that share the same email/phone onto this session.
    customer = await this.customerIdentity.claimRelatedCustomers(customer);

    const payload = {
      sub: customer.id,
      phone: customer.phone,
      email: customer.email,
      type: 'STOREFRONT_CUSTOMER',
    };
    const token = this.jwtService.sign(payload);

    res.cookie('storefront_token', token, {
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    this.logger.log(`[OTP] ✓ Customer ${customer.id} authenticated via OTP`);

    return {
      success: true,
      customer: toStorefrontCustomerResponse(customer),
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
      select: { id: true, fullName: true, phone: true, email: true, taxId: true },
    });

    if (!customer) {
      throw new UnauthorizedException('Cliente no encontrado.');
    }

    return toStorefrontCustomerResponse(customer);
  }

  /**
   * PATCH /storefront/auth/me — Update authenticated customer profile.
   */
  @Patch('me')
  @UseGuards(StorefrontAuthGuard)
  async updateMe(@Req() req: Request, @Body() dto: UpdateStorefrontProfileDto) {
    const reqUser = (req as any).user;
    const customerId = reqUser.customerId;

    const fullName = dto.fullName.trim();
    if (!fullName) {
      throw new BadRequestException('El nombre es obligatorio.');
    }

    const email = dto.email !== undefined ? this.normalizeEmail(dto.email) : undefined;
    if (dto.email !== undefined && dto.email.trim() && !email) {
      throw new BadRequestException('Correo electrónico inválido.');
    }

    const phone = dto.phone !== undefined
      ? (dto.phone.trim() ? this.normalizePhone(dto.phone) : null)
      : undefined;
    if (dto.phone !== undefined && dto.phone.trim() && !phone) {
      throw new BadRequestException('Número de teléfono inválido.');
    }

    const taxId = dto.taxId !== undefined
      ? (dto.taxId.trim() || null)
      : undefined;

    // If email/phone/taxId belong to a guest (or related) customer from a prior
    // checkout, absorb that record and its orders instead of blocking the profile.
    await this.customerIdentity.resolveProfileConflict(customerId, {
      email,
      phone,
      taxId,
    });

    if (email) {
      const emailTaken = await this.prisma.customer.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, id: { not: customerId } },
      });
      if (emailTaken) {
        throw new ConflictException('Este correo electrónico ya está registrado.');
      }
    }

    if (phone) {
      const phoneTaken = await this.prisma.customer.findFirst({
        where: { phone, id: { not: customerId } },
      });
      if (phoneTaken) {
        throw new ConflictException('Este teléfono ya está registrado.');
      }
    }

    if (taxId) {
      const taxIdTaken = await this.prisma.customer.findFirst({
        where: { taxId, id: { not: customerId } },
      });
      if (taxIdTaken) {
        throw new ConflictException('Este DNI/CUIT ya está registrado.');
      }
    }

    const data: Record<string, string | null> = { fullName };
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (taxId !== undefined) data.taxId = taxId;

    await this.prisma.customer.update({
      where: { id: customerId },
      data,
    });

    // After saving contact fields, claim any remaining related guest rows.
    const claimed = await this.customerIdentity.claimRelatedCustomers(
      await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } }),
    );

    this.logger.log(`[Profile] Customer ${customerId} updated profile`);

    return toStorefrontCustomerResponse({
      id: claimed.id,
      fullName: claimed.fullName,
      phone: claimed.phone,
      email: claimed.email,
      taxId: claimed.taxId,
    });
  }

  /**
   * POST /storefront/auth/logout — Clears the storefront_token cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('storefront_token', {
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: 'strict',
    });
    return { success: true, message: 'Sesión cerrada.' };
  }

  private normalizeEmail(raw: string): string | null {
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) return null;
    return email;
  }

  /**
   * Normalize phone to international format without '+'.
   * Accepts: "1122334455", "011 1234-5678", "549..." etc.
   */
  private normalizePhone(raw: string): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) return null;

    if (digits.startsWith('549') && digits.length >= 12) return digits;
    if (digits.startsWith('54') && digits.length >= 11) return digits;

    if (digits.startsWith('0') && digits.length >= 10) {
      return '54' + digits.slice(1);
    }

    if (digits.length >= 8 && digits.length <= 11) {
      return '549' + digits;
    }

    return digits;
  }
}
