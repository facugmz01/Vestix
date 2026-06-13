import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppOpenWaService } from './channels/whatsapp-openwa.service';
import { SmsGatewayService } from './channels/sms-gateway.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationChannel } from './models/notification.model';
export declare class NotificationsProcessor extends WorkerHost {
    private readonly smtpService;
    private readonly whatsAppService;
    private readonly smsService;
    private readonly prisma;
    private readonly logger;
    constructor(smtpService: SmtpService, whatsAppService: WhatsAppOpenWaService, smsService: SmsGatewayService, prisma: PrismaService);
    process(job: Job<{
        channel: NotificationChannel;
        templateKey: string;
        recipient: string;
        variables: Record<string, string>;
    }>): Promise<void>;
    private interpolate;
}
