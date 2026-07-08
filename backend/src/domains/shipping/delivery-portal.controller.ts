import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { ShippingService } from './shipping.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';

interface AuthRequest extends Request {
  user: { userId: string; email: string; roleId: string };
}

@Controller('delivery-portal')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DeliveryPortalController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('assignments')
  @RequirePermissions({ action: 'read', subject: 'Delivery' })
  listAssignments(
    @Req() req: AuthRequest,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.shippingService.listMyDeliveries(req.user.userId, {
      status,
      page: parseInt(page || '1'),
      pageSize: parseInt(pageSize || '20'),
    });
  }

  @Get('assignments/:deliveryId')
  @RequirePermissions({ action: 'read', subject: 'Delivery' })
  getAssignment(@Req() req: AuthRequest, @Param('deliveryId') deliveryId: string) {
    return this.shippingService.getMyDeliveryAssignment(req.user.userId, deliveryId);
  }

  @Post('assignments/:deliveryId/location')
  @RequirePermissions({ action: 'update', subject: 'Delivery' })
  updateLocation(
    @Req() req: AuthRequest,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.shippingService.updateLocationForDriver(req.user.userId, deliveryId, dto);
  }

  @Post('assignments/:deliveryId/arrive')
  @RequirePermissions({ action: 'update', subject: 'Delivery' })
  markArrived(@Req() req: AuthRequest, @Param('deliveryId') deliveryId: string) {
    return this.shippingService.markArrivedForDriver(req.user.userId, deliveryId);
  }

  @Post('assignments/:deliveryId/photo')
  @RequirePermissions({ action: 'update', subject: 'Delivery' })
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
    @Req() req: AuthRequest,
    @Param('deliveryId') deliveryId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió imagen');
    const url = `/uploads/delivery-proofs/${file.filename}`;
    return this.shippingService.uploadProofPhotoForDriver(req.user.userId, deliveryId, url);
  }

  @Post('assignments/:deliveryId/complete')
  @RequirePermissions({ action: 'update', subject: 'Delivery' })
  completeDelivery(
    @Req() req: AuthRequest,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: CompleteDeliveryDto & { latitude?: number; longitude?: number },
  ) {
    const coords = dto.latitude != null && dto.longitude != null
      ? { latitude: dto.latitude, longitude: dto.longitude }
      : undefined;
    return this.shippingService.completeDeliveryForDriver(
      req.user.userId,
      deliveryId,
      dto,
      coords,
    );
  }
}
