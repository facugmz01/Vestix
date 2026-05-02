import { NotificationJob, NotificationChannel, TemplateKey } from './models/notification.model';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
export declare class NotificationsService {
    private readonly smtpService;
    private readonly whatsAppService;
    private readonly logger;
    private queue;
    constructor(smtpService: SmtpService, whatsAppService: WhatsAppEvolutionService);
    enqueue(payload: {
        channel: NotificationChannel;
        templateKey: TemplateKey;
        recipient: string;
        variables: Record<string, string>;
    }): Promise<NotificationJob>;
    dispatch(jobId: string): Promise<void>;
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
    private interpolate;
}
