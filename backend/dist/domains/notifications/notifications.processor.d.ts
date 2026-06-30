import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { SmsGatewayService } from './channels/sms-gateway.service';
import { PrismaService } from '../../core/prisma/prisma.service';
interface NotificationJobData {
    channel: string;
    templateKey: string;
    recipient: string;
    variables: Record<string, string>;
    logId?: string;
}
export declare class NotificationsProcessor extends WorkerHost {
    private readonly smtpService;
    private readonly whatsAppService;
    private readonly smsService;
    private readonly prisma;
    private readonly logger;
    constructor(smtpService: SmtpService, whatsAppService: WhatsAppEvolutionService, smsService: SmsGatewayService, prisma: PrismaService);
    process(job: Job<NotificationJobData>): Promise<void>;
    private failLog;
    private interpolate;
}
export {};
