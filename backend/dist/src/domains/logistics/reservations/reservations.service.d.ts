import { ReservationLine } from './models/reservation.model';
import { StockMovementService } from '../stock-movement.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
export declare class ReservationsService {
    private readonly stockService;
    private readonly prisma;
    constructor(stockService: StockMovementService, prisma: PrismaService);
    createReservation(payload: {
        cartId: string;
        warehouseId: string;
        branchId: string;
        customerId?: string;
        lines: ReservationLine[];
        ttlMinutes?: number;
    }): Promise<{
        id: string;
        warehouseId: string;
        branchId: string;
        customerId: string | null;
        lines: import(".prisma/client").Prisma.JsonValue;
        status: string;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    completeReservation(cartId: string): Promise<{
        id: string;
        warehouseId: string;
        branchId: string;
        customerId: string | null;
        lines: import(".prisma/client").Prisma.JsonValue;
        status: string;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelReservation(cartId: string): Promise<{
        id: string;
        warehouseId: string;
        branchId: string;
        customerId: string | null;
        lines: import(".prisma/client").Prisma.JsonValue;
        status: string;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sweepExpiredReservations(): Promise<{
        sweptCount: number;
    }>;
}
