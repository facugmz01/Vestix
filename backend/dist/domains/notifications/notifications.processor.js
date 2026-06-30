"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
const smtp_service_1 = require("./channels/smtp.service");
const whatsapp_evolution_service_1 = require("./channels/whatsapp-evolution.service");
const sms_gateway_service_1 = require("./channels/sms-gateway.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notification_model_1 = require("./models/notification.model");
let NotificationsProcessor = NotificationsProcessor_1 = class NotificationsProcessor extends bullmq_1.WorkerHost {
    constructor(smtpService, whatsAppService, smsService, prisma) {
        super();
        this.smtpService = smtpService;
        this.whatsAppService = whatsAppService;
        this.smsService = smsService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsProcessor_1.name);
    }
    async process(job) {
        const { channel, templateKey, recipient, variables, logId } = job.data;
        this.logger.log(`[Queue] Processing job ${job.id} — ${channel}/${templateKey} → ${recipient}`);
        const template = await this.prisma.notificationTemplate.findUnique({
            where: { event_channel: { event: templateKey, channel } },
        });
        if (!template) {
            const error = `No template found in DB for key=${templateKey}, channel=${channel}`;
            await this.failLog(logId, error);
            throw new bullmq_2.UnrecoverableError(error);
        }
        const body = this.interpolate(template.body, variables);
        const subject = template.subject ? this.interpolate(template.subject, variables) : undefined;
        try {
            if (channel === notification_model_1.NotificationChannel.EMAIL) {
                await this.smtpService.send(recipient, subject || 'Notificación', body);
            }
            else if (channel === notification_model_1.NotificationChannel.WHATSAPP) {
                await this.whatsAppService.sendText(recipient, body);
            }
            else if (channel === notification_model_1.NotificationChannel.SMS) {
                await this.smsService.sendSms(recipient, body);
            }
            else {
                this.logger.warn(`[Queue] Channel "${channel}" has no dispatcher. Skipping send.`);
            }
            if (logId) {
                await this.prisma.notificationLog.update({
                    where: { id: logId },
                    data: { status: 'SENT', sentAt: new Date() },
                }).catch(e => this.logger.warn(`Could not update log ${logId}: ${e.message}`));
            }
            this.logger.log(`[Queue] ✓ Job ${job.id} completed successfully`);
        }
        catch (err) {
            await this.failLog(logId, err.message);
            throw err;
        }
    }
    async failLog(logId, errorMessage) {
        if (!logId)
            return;
        await this.prisma.notificationLog.update({
            where: { id: logId },
            data: { status: 'FAILED', errorMessage },
        }).catch(e => this.logger.warn(`Could not fail log ${logId}: ${e.message}`));
    }
    interpolate(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
exports.NotificationsProcessor = NotificationsProcessor = NotificationsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('notifications_queue'),
    __metadata("design:paramtypes", [smtp_service_1.SmtpService,
        whatsapp_evolution_service_1.WhatsAppEvolutionService,
        sms_gateway_service_1.SmsGatewayService,
        prisma_service_1.PrismaService])
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map