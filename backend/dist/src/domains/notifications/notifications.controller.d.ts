import { NotificationsService } from './notifications.service';
import { WhatsAppOpenWaService } from './channels/whatsapp-openwa.service';
import { NotificationChannel, TemplateKey } from './models/notification.model';
export declare class CreateTemplateDto {
    name: string;
    event: TemplateKey;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    isActive?: boolean;
}
export declare class UpdateTemplateDto {
    name?: string;
    subject?: string;
    body?: string;
    isActive?: boolean;
}
export declare class SendTestNotificationDto {
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables?: Record<string, string>;
}
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly whatsappService;
    constructor(notificationsService: NotificationsService, whatsappService: WhatsAppOpenWaService);
    getTemplates(page: string, pageSize: string): Promise<{
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
    createTemplate(data: CreateTemplateDto): Promise<{
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
    updateTemplate(id: string, data: UpdateTemplateDto): Promise<{
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
    getQueue(): Promise<{
        data: import("./models/notification.model").NotificationJob[];
        total: number;
    }>;
    sendTest(body: SendTestNotificationDto): Promise<{
        success: boolean;
        message: string;
        job: import("./models/notification.model").NotificationJob;
    }>;
    getWhatsAppStatus(): Promise<{
        isReady: boolean;
        qrCode: any;
    }>;
}
