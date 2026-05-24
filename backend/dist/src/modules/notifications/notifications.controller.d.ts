import { NotificationsService } from './notifications.service';
import { NotificationChannel, TemplateKey } from './models/notification.model';
export declare class SendTestNotificationDto {
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables?: Record<string, string>;
}
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getTemplates(page: string, pageSize: string): {
        data: import("./models/notification.model").NotificationTemplate[];
        total: number;
    };
    getQueue(): {
        data: import("./models/notification.model").NotificationJob[];
        total: number;
    };
    sendTest(body: SendTestNotificationDto): Promise<{
        success: boolean;
        message: string;
        job: import("./models/notification.model").NotificationJob;
    }>;
}
