import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ShippingService } from './shipping.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';

@Controller('driver')
export class DriverController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get(':token')
  getDelivery(@Param('token') token: string) {
    return this.shippingService.getDriverDelivery(token);
  }

  @Post(':token/location')
  updateLocation(@Param('token') token: string, @Body() dto: UpdateLocationDto) {
    return this.shippingService.updateLocationByDriverToken(token, dto);
  }

  @Post(':token/arrive')
  markArrived(@Param('token') token: string) {
    return this.shippingService.markArrivedByDriverToken(token);
  }

  @Post(':token/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/delivery-proofs',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `proof-${unique}${extname(file.originalname) || '.jpg'}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Solo se permiten imágenes') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió imagen');
    const url = `/uploads/delivery-proofs/${file.filename}`;
    return this.shippingService.uploadProofPhotoByDriverToken(token, url);
  }

  @Post(':token/complete')
  completeDelivery(
    @Param('token') token: string,
    @Body() dto: CompleteDeliveryDto & { latitude?: number; longitude?: number },
  ) {
    const coords = dto.latitude != null && dto.longitude != null
      ? { latitude: dto.latitude, longitude: dto.longitude }
      : undefined;
    return this.shippingService.completeDeliveryByDriverToken(token, dto, coords);
  }
}
