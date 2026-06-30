import { PrismaService } from '../../core/prisma/prisma.service';
import { OpenShiftDto, CloseShiftDto } from './dto/treasury.dto';
export declare class TreasuryService {
    private prisma;
    constructor(prisma: PrismaService);
    getActiveShift(userId: string): Promise<{
        cashRegister: {
            id: string;
            name: string;
            code: string;
            branchId: string;
            status: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    openShift(dto: OpenShiftDto, userId: string): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    closeShift(dto: CloseShiftDto, userId: string): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    findAllShifts(filters: any): Promise<{
        data: ({
            cashRegister: {
                id: string;
                name: string;
                code: string;
                branchId: string;
                status: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            cashRegisterId: string;
            openedByUserId: string;
            closedByUserId: string | null;
            openingAmount: number;
            closingAmount: number | null;
            expectedAmount: number | null;
            difference: number | null;
            status: string;
            openedAt: Date;
            closedAt: Date | null;
            notes: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOneShift(id: string): Promise<{
        cashRegister: {
            id: string;
            name: string;
            code: string;
            branchId: string;
            status: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        sales: {
            id: string;
            branchId: string;
            warehouseId: string | null;
            source: string;
            customerId: string | null;
            subtotal: number;
            cartDiscountTotal: number;
            grandTotal: number;
            appliedPromotions: import(".prisma/client").Prisma.JsonValue;
            paymentMethod: string;
            paymentAccountId: string | null;
            status: string;
            cashShiftId: string | null;
            issueInvoice: boolean;
            createdAt: Date;
            syncedAt: Date;
        }[];
    } & {
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    getShiftMovements(shiftId: string): Promise<any[]>;
    createMovement(shiftId: string, payload: any, userId: string): Promise<void>;
}
