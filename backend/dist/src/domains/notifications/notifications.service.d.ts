import { Queue } from 'bullmq';
import { NotificationJob, NotificationChannel, TemplateKey } from './models/notification.model';
export declare class NotificationsService {
    private readonly notificationsQueue;
    private readonly logger;
    constructor(notificationsQueue: Queue);
    enqueue(payload: {
        channel: NotificationChannel;
        templateKey: TemplateKey;
        recipient: string;
        variables: Record<string, string>;
    }): Promise<NotificationJob>;
    getQueue(): Promise<NotificationJob[]>;
    notifyOrderConfirmed(recipient: string, channel: NotificationChannel, vars: {
        customerName: string;
        orderId: string;
        total: string;
    }): Promise<NotificationJob>;
    notifyOrderShipped(recipient: string, channel: NotificationChannel, vars: {
        customerName: string;
        orderId: string;
        courierName: string;
        trackingNumber: string;
    }): Promise<NotificationJob>;
    notifyLowStock(managerEmail: string, vars: {
        productName: string;
        sku: string;
        quantity: string;
        branchName: string;
    }): Promise<NotificationJob>;
    notifyShiftDiscrepancy(managerEmail: string, vars: {
        branchName: string;
        cashierName: string;
        registerName: string;
        difference: string;
        expected: string;
        actual: string;
    }): Promise<NotificationJob>;
}
