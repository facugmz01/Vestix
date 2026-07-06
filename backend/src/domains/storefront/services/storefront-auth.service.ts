import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class StorefrontAuthService {
  private readonly logger = new Logger(StorefrontAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(phone: string) {
    if (!phone) throw new BadRequestException('Phone number is required');

    // Remove non-numeric characters for standardization
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis (Valid for 5 minutes)
    await this.redis.getClient().setex(`storefront_otp_${cleanPhone}`, 300, otp);

    // Enqueue notification via WhatsApp OpenWaOtp
    await this.notifications.enqueue({
      channel: 'WHATSAPP' as any,
      templateKey: 'OTP_CODE' as any,
      recipient: cleanPhone,
      variables: {
        otpCode: otp,
      }
    });

    this.logger.log(`Requested OTP for ${cleanPhone}`);
    return { success: true, message: 'OTP enviado correctamente' };
  }

  async verifyOtp(phone: string, code: string) {
    if (!phone || !code) throw new BadRequestException('Phone and code are required');

    const cleanPhone = phone.replace(/\D/g, '');
    const redisKey = `storefront_otp_${cleanPhone}`;
    const storedOtp = await this.redis.getClient().get(redisKey);

    if (!storedOtp || storedOtp !== code) {
      throw new BadRequestException('Código inválido o expirado');
    }

    // OTP is valid. Clear it to prevent reuse.
    await this.redis.getClient().del(redisKey);

    // Find or create Customer
    let customer = await this.prisma.customer.findFirst({
      where: { phone: cleanPhone }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          fullName: 'Cliente Web',
          phone: cleanPhone,
          type: 'INDIVIDUAL',
        }
      });
      this.logger.log(`Created new customer ${customer.id} for storefront`);
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: customer.id,
      phone: customer.phone,
      type: 'CUSTOMER',
    });

    return { success: true, token, customer };
  }
}
