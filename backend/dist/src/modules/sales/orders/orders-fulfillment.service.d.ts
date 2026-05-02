import { OrderFulfillment } from './models/fulfillment.model';
import { SalesService } from '../sales.service';
import { StockMovementService } from '../../inventory/stock-movement.service';
export declare class OrdersFulfillmentService {
    private readonly salesService;
    private readonly stockService;
    constructor(salesService: SalesService, stockService: StockMovementService);
    private fulfillments;
    initializeFulfillment(saleOrderId: string): Promise<OrderFulfillment>;
    markAsPaid(id: string): Promise<OrderFulfillment>;
    startPicking(id: string): Promise<OrderFulfillment>;
    markAsPacked(id: string): Promise<OrderFulfillment>;
    shipOrder(id: string, trackingNumber: string, courierName: string): Promise<OrderFulfillment>;
    markAsDelivered(id: string): Promise<OrderFulfillment>;
    private getFulfillment;
}
