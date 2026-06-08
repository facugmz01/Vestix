import { PrismaService } from '../../core/prisma/prisma.service';
export declare class ReservationExpiryJob {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    releaseExpiredReservations(): Promise<void>;
}
