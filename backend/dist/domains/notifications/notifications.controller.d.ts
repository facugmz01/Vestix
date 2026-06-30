import { NotificationsService } from './notifications.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { NotificationChannel } from './models/notification.model';
export declare class CreateTemplateDto {
    name: string;
    event: string;
    channel: string;
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
export declare class ToggleTemplateDto {
    isActive: boolean;
}
export declare class SendTestNotificationDto {
    channel: NotificationChannel;
    templateKey: string;
    recipient: string;
    variables?: Record<string, string>;
}
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly whatsappService;
    constructor(notificationsService: NotificationsService, whatsappService: WhatsAppEvolutionService);
    getTemplates(page: number, pageSize: number, channel?: string, isActiveRaw?: string): Promise<{
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
    toggleTemplate(id: string, dto: ToggleTemplateDto): Promise<{
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
    getLogs(page: number, pageSize: number, status?: string, channel?: string, event?: string, search?: string): Promise<{
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
