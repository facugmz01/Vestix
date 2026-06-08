import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { NotificationChannel } from './models/notification.model';
export declare class NotificationsProcessor extends WorkerHost {
    private readonly smtpService;
    private readonly whatsAppService;
    private readonly logger;
    constructor(smtpService: SmtpService, whatsAppService: WhatsAppEvolutionService);
    process(job: Job<{
        channel: NotificationChannel;
        templateKey: string;
        recipient: string;
        variables: Record<string, string>;
    }>): Promise<void>;
    private interpolate;
}
