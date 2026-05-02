import { StockReservation, ReservationLine } from './models/reservation.model';
import { StockMovementService } from '../stock-movement.service';
export declare class ReservationsService {
    private readonly stockService;
    constructor(stockService: StockMovementService);
    private holds;
    createReservation(payload: {
        cartId: string;
        warehouseId: string;
        branchId: string;
        customerId?: string;
        lines: ReservationLine[];
        ttlMinutes?: number;
    }): Promise<StockReservation>;
    completeReservation(cartId: string): Promise<StockReservation>;
    cancelReservation(cartId: string): Promise<StockReservation>;
    sweepExpiredReservations(): Promise<{
        sweptCount: number;
    }>;
}
