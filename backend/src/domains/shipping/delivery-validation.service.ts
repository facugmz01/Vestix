import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';
import { haversineDistanceMeters } from './utils/geofence.util';
import { ValidationMethod, ValidationStatus } from './models/delivery.model';

const OTP_ATTEMPT_PREFIX = 'delivery:otp:attempts:';
const MAX_OTP_ATTEMPTS = 3;
const OTP_ATTEMPT_TTL_SECONDS = 15 * 60;

@Injectable()
export class DeliveryValidationService {
  constructor(private readonly redisService: RedisService) {}

  generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async validateOtp(
    deliveryId: string,
    expectedCode: string,
    providedCode: string,
    expiresAt: Date | null,
  ): Promise<{ passed: boolean; metadata: Record<string, unknown> }> {
    if (!expectedCode) {
      throw new BadRequestException('Este envío no tiene código de entrega configurado.');
    }

    if (expiresAt && expiresAt < new Date()) {
      throw new BadRequestException('El código de entrega expiró. Solicitá uno nuevo al administrador.');
    }

    const attempts = await this.incrementAttempts(deliveryId);
    if (attempts > MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('Demasiados intentos fallidos. Esperá 15 minutos e intentá de nuevo.');
    }

    const passed = expectedCode === providedCode;
    return {
      passed,
      metadata: { attempts, method: ValidationMethod.OTP },
    };
  }

  validateGeofence(
    driverLat: number,
    driverLng: number,
    destLat: number,
    destLng: number,
    radiusMeters: number,
  ): { passed: boolean; metadata: Record<string, unknown> } {
    const distance = haversineDistanceMeters(driverLat, driverLng, destLat, destLng);
    return {
      passed: distance <= radiusMeters,
      metadata: {
        distanceMeters: Math.round(distance),
        radiusMeters,
        method: ValidationMethod.GEOFENCE,
      },
    };
  }

  async recordValidation(
    deliveryId: string,
    method: ValidationMethod,
    passed: boolean,
    metadata: Record<string, unknown> = {},
  ) {
    return {
      deliveryId,
      method,
      status: passed ? ValidationStatus.PASSED : ValidationStatus.FAILED,
      metadata,
      validatedAt: passed ? new Date() : null,
    };
  }

  async resetAttempts(deliveryId: string): Promise<void> {
    const redis = this.redisService.getClient();
    await redis.del(`${OTP_ATTEMPT_PREFIX}${deliveryId}`);
  }

  private async incrementAttempts(deliveryId: string): Promise<number> {
    const redis = this.redisService.getClient();
    const key = `${OTP_ATTEMPT_PREFIX}${deliveryId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, OTP_ATTEMPT_TTL_SECONDS);
    }
    return count;
  }
}
