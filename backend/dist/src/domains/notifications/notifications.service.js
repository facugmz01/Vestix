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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const notification_model_1 = require("./models/notification.model");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notification_templates_registry_1 = require("./templates/notification-templates.registry");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(notificationsQueue, prisma) {
        this.notificationsQueue = notificationsQueue;
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async onModuleInit() {
        const count = await this.prisma.notificationTemplate.count();
        if (count === 0) {
            this.logger.log('Seeding initial notification templates...');
            for (const tpl of notification_templates_registry_1.NOTIFICATION_TEMPLATES) {
                await this.prisma.notificationTemplate.upsert({
                    where: {
                        event_channel: {
                            event: tpl.key,
                            channel: tpl.channel,
                        }
                    },
                    update: {},
                    create: {
                        name: `Plantilla ${tpl.key} (${tpl.channel})`,
                        event: tpl.key,
                        channel: tpl.channel,
                        subject: tpl.subject,
                        body: tpl.body,
                        isActive: true,
                    }
                });
            }
            this.logger.log('Notification templates seeded successfully.');
        }
    }
    async getTemplates(page, pageSize) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.notificationTemplate.findMany({ skip, take: pageSize }),
            this.prisma.notificationTemplate.count(),
        ]);
        return { data, total };
    }
    async createTemplate(data) {
        return this.prisma.notificationTemplate.create({ data });
    }
    async updateTemplate(id, data) {
        return this.prisma.notificationTemplate.update({ where: { id }, data });
    }
    async enqueue(payload) {
        const template = await this.prisma.notificationTemplate.findUnique({
            where: {
                event_channel: {
                    event: payload.templateKey,
                    channel: payload.channel,
                }
            }
        });
        if (!template) {
            this.logger.warn(`No template found for ${payload.templateKey} on ${payload.channel}. Skipping notification.`);
            return null;
        }
        if (!template.isActive) {
            this.logger.log(`Template ${payload.templateKey} on ${payload.channel} is inactive. Skipping notification.`);
            return null;
        }
        const job = await this.notificationsQueue.add('send_notification', {
            channel: payload.channel,
            templateKey: payload.templateKey,
            recipient: payload.recipient,
            variables: payload.variables || {},
        });
        this.logger.log(`[Queue] Enqueued ${payload.channel} notification (${payload.templateKey}) → ${payload.recipient} via BullMQ (Job ID: ${job.id})`);
        return {
            id: job.id || '',
            channel: payload.channel,
            templateKey: payload.templateKey,
            recipient: payload.recipient,
            variables: payload.variables || {},
            status: notification_model_1.NotificationStatus.QUEUED,
            attempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async getQueue() {
        const jobs = await this.notificationsQueue.getJobs([
            'active',
            'waiting',
            'completed',
            'failed',
            'delayed',
            'paused',
        ]);
        const sortedJobs = jobs.sort((a, b) => b.timestamp - a.timestamp);
        return sortedJobs.map(job => {
            let status = notification_model_1.NotificationStatus.QUEUED;
            if (job.failedReason) {
                status = notification_model_1.NotificationStatus.FAILED;
            }
            else if (job.finishedOn) {
                status = notification_model_1.NotificationStatus.SENT;
            }
            else if (job.processedOn) {
                status = notification_model_1.NotificationStatus.SENDING;
            }
            return {
                id: job.id || '',
                channel: job.data.channel,
                templateKey: job.data.templateKey,
                recipient: job.data.recipient,
                variables: job.data.variables,
                status,
                attempts: job.attemptsMade,
                lastError: job.failedReason || undefined,
                createdAt: new Date(job.timestamp),
                updatedAt: new Date(job.finishedOn || job.processedOn || job.timestamp),
            };
        });
    }
    async notifyOrderConfirmed(recipient, channel, vars) {
        return this.enqueue({ channel, templateKey: notification_model_1.TemplateKey.ORDER_CONFIRMED, recipient, variables: vars });
    }
    async notifyOrderShipped(recipient, channel, vars) {
        return this.enqueue({ channel, templateKey: notification_model_1.TemplateKey.ORDER_SHIPPED, recipient, variables: vars });
    }
    async notifyLowStock(managerEmail, vars) {
        return this.enqueue({ channel: notification_model_1.NotificationChannel.EMAIL, templateKey: notification_model_1.TemplateKey.LOW_STOCK_ALERT, recipient: managerEmail, variables: vars });
    }
    async notifyShiftDiscrepancy(managerEmail, vars) {
        return this.enqueue({ channel: notification_model_1.NotificationChannel.EMAIL, templateKey: notification_model_1.TemplateKey.SHIFT_CLOSING_DISCREPANCY, recipient: managerEmail, variables: vars });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('notifications_queue')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map