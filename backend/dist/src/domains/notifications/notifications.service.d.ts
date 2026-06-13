import { Queue } from 'bullmq';
import { NotificationJob, NotificationChannel, TemplateKey } from './models/notification.model';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class NotificationsService {
    private readonly notificationsQueue;
    private readonly prisma;
    private readonly logger;
    constructor(notificationsQueue: Queue, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    getTemplates(page: number, pageSize: number): Promise<{
        data: {
            id: string;
            name: string;
            event: string;
            channel: string;
            subject: string | null;
            body: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    createTemplate(data: any): Promise<{
        id: string;
        name: string;
        event: string;
        channel: string;
        subject: string | null;
        body: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTemplate(id: string, data: any): Promise<{
        id: string;
        name: string;
        event: string;
        channel: string;
        subject: string | null;
        body: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    enqueue(payload: {
        channel: NotificationChannel;
        templateKey: TemplateKey;
        recipient: string;
        variables: Record<string, string>;
    }): Promise<NotificationJob | null>;
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
