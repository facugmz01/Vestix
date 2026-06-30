import { Queue } from 'bullmq';
import { NotificationJob, NotificationChannel, TemplateKey } from './models/notification.model';
import { PrismaService } from '../../core/prisma/prisma.service';
export interface GetTemplatesFilters {
    page?: number;
    pageSize?: number;
    channel?: string;
    isActive?: boolean;
}
export interface GetLogsFilters {
    page?: number;
    pageSize?: number;
    status?: string;
    channel?: string;
    event?: string;
    search?: string;
}
export declare class NotificationsService {
    private readonly notificationsQueue;
    private readonly prisma;
    private readonly logger;
    constructor(notificationsQueue: Queue, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    getTemplates(filters?: GetTemplatesFilters): Promise<{
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
        page: number;
        pageSize: number;
    }>;
    getTemplate(id: string): Promise<{
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
    toggleTemplate(id: string, isActive: boolean): Promise<{
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
    getLogs(filters?: GetLogsFilters): Promise<{
        data: {
            id: string;
            templateId: string | null;
            event: string;
            channel: string;
            recipient: string;
            referenceId: string | null;
            status: string;
            errorMessage: string | null;
            sentAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    enqueue(payload: {
        channel: NotificationChannel;
        templateKey: TemplateKey;
        recipient: string;
        variables: Record<string, string>;
        referenceId?: string;
    }): Promise<NotificationJob | null>;
    getQueue(): Promise<NotificationJob[]>;
    notifyOrderConfirmed(recipient: string, channel: NotificationChannel, vars: {
        customerName: string;
        orderId: string;
        total: string;
    }, referenceId?: string): Promise<NotificationJob>;
    notifyOrderShipped(recipient: string, channel: NotificationChannel, vars: {
        customerName: string;
        orderId: string;
        courierName: string;
        trackingNumber: string;
    }, referenceId?: string): Promise<NotificationJob>;
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
