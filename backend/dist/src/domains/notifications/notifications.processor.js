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
const common_1 = require("@nestjs/common");
const smtp_service_1 = require("./channels/smtp.service");
const whatsapp_openwa_service_1 = require("./channels/whatsapp-openwa.service");
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
        const { channel, templateKey, recipient, variables } = job.data;
        this.logger.log(`[Queue] Processing job ${job.id} for ${recipient}`);
        const template = await this.prisma.notificationTemplate.findUnique({
            where: {
                event_channel: { event: templateKey, channel },
            }
        });
        if (!template) {
            throw new Error(`No template found in DB for key=${templateKey}, channel=${channel}`);
        }
        const body = this.interpolate(template.body, variables);
        const subject = template.subject ? this.interpolate(template.subject, variables) : undefined;
        if (channel === 'EMAIL') {
            await this.smtpService.send(recipient, subject || 'Notificación', body);
        }
        else if (channel === 'WHATSAPP') {
            const isOtp = templateKey === notification_model_1.TemplateKey.OTP_CODE;
            await this.whatsAppService.sendText(recipient, body, isOtp);
        }
        else if (channel === 'SMS') {
            await this.smsService.sendSms(recipient, body);
        }
        this.logger.log(`[Queue] ✓ Job ${job.id} successfully completed`);
    }
    interpolate(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
exports.NotificationsProcessor = NotificationsProcessor = NotificationsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('notifications_queue'),
    __metadata("design:paramtypes", [smtp_service_1.SmtpService,
        whatsapp_openwa_service_1.WhatsAppOpenWaService,
        sms_gateway_service_1.SmsGatewayService,
        prisma_service_1.PrismaService])
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map