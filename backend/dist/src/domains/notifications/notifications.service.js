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
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(notificationsQueue) {
        this.notificationsQueue = notificationsQueue;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async enqueue(payload) {
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
    __metadata("design:paramtypes", [bullmq_2.Queue])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map