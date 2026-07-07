import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';

/** Redis-backed rate limits for OTP and other high-frequency notifications. */
@Injectable()
export class NotificationRateLimitService {
  private readonly OTP_HOURLY_LIMIT = 5;
  private readonly OTP_DAILY_LIMIT = 15;
  private readonly OTP_IP_HOURLY_LIMIT = 30;

  constructor(private readonly redis: RedisService) {}

  async assertOtpAllowed(phone: string, clientIp?: string): Promise<void> {
    const redis = this.redis.getClient();

    const hourKey = `otp_rate:phone:${phone}:hour`;
    const dayKey = `otp_rate:phone:${phone}:day`;
    const ipKey = clientIp ? `otp_rate:ip:${clientIp}:hour` : null;

    const [hourCount, dayCount, ipCount] = await Promise.all([
      redis.incr(hourKey),
      redis.incr(dayKey),
      ipKey ? redis.incr(ipKey) : Promise.resolve(0),
    ]);

    if (hourCount === 1) await redis.expire(hourKey, 3600);
    if (dayCount === 1) await redis.expire(dayKey, 86_400);
    if (ipKey && ipCount === 1) await redis.expire(ipKey, 3600);

    if (hourCount > this.OTP_HOURLY_LIMIT) {
      throw new BadRequestException(
        'Demasiados códigos solicitados. Intentá de nuevo en una hora.',
      );
    }
    if (dayCount > this.OTP_DAILY_LIMIT) {
      throw new BadRequestException(
        'Límite diario de códigos alcanzado. Contactá a soporte.',
      );
    }
    if (ipKey && ipCount > this.OTP_IP_HOURLY_LIMIT) {
      throw new BadRequestException(
        'Demasiadas solicitudes desde esta red. Intentá más tarde.',
      );
    }
  }
}
