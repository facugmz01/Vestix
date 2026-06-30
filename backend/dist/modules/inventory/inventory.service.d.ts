import { PrismaService } from '../../core/prisma/prisma.service';
import { RecordMovementDto } from './dto/record-movement.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    recordMovement(dto: RecordMovementDto, externalTx?: any): Promise<any>;
    private validateMovementLogic;
    private incrementStock;
    private decrementStock;
}
