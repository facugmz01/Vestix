"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const notification_model_1 = require("./models/notification.model");
const notification_templates_registry_1 = require("./templates/notification-templates.registry");
const smtp_service_1 = require("./channels/smtp.service");
const whatsapp_evolution_service_1 = require("./channels/whatsapp-evolution.service");
const crypto = __importStar(require("crypto"));
const MAX_ATTEMPTS = 3;
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(smtpService, whatsAppService) {
        this.smtpService = smtpService;
        this.whatsAppService = whatsAppService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.queue = [];
    }
    async enqueue(payload) {
        const job = {
            id: crypto.randomUUID(),
            channel: payload.channel,
            templateKey: payload.templateKey,
            recipient: payload.recipient,
            variables: payload.variables || {},
            status: notification_model_1.NotificationStatus.QUEUED,
            attempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.queue.push(job);
        this.logger.log(`[Queue] Enqueued ${payload.channel} notification (${payload.templateKey}) → ${payload.recipient}`);
        setImmediate(() => this.dispatch(job.id));
        return job;
    }
    async dispatch(jobId) {
        const job = this.queue.find(j => j.id === jobId);
        if (!job)
            throw new common_1.NotFoundException('Notification job not found');
        const template = notification_templates_registry_1.NOTIFICATION_TEMPLATES.find(t => t.key === job.templateKey && t.channel === job.channel);
        if (!template) {
            job.status = notification_model_1.NotificationStatus.FAILED;
            job.lastError = `No template found for key=${job.templateKey}, channel=${job.channel}`;
            job.updatedAt = new Date();
            this.logger.error(`[Dispatch] ${job.lastError}`);
            return;
        }
        const vars = job.variables || {};
        const body = this.interpolate(template.body, vars);
        const subject = template.subject ? this.interpolate(template.subject, vars) : undefined;
        job.status = notification_model_1.NotificationStatus.SENDING;
        job.attempts += 1;
        job.updatedAt = new Date();
        try {
            if (job.channel === notification_model_1.NotificationChannel.EMAIL) {
                await this.smtpService.send(job.recipient, subject, body);
            }
            else if (job.channel === notification_model_1.NotificationChannel.WHATSAPP) {
                await this.whatsAppService.sendText(job.recipient, body);
            }
            job.status = notification_model_1.NotificationStatus.SENT;
            job.updatedAt = new Date();
            this.logger.log(`[Dispatch] ✓ Sent ${job.channel} job ${job.id}`);
        }
        catch (err) {
            job.lastError = err.message;
            job.updatedAt = new Date();
            if (job.attempts < MAX_ATTEMPTS) {
                const delayMs = Math.pow(5, job.attempts) * 1000;
                job.status = notification_model_1.NotificationStatus.RETRYING;
                this.logger.warn(`[Retry] Job ${job.id} failed (attempt ${job.attempts}). Retrying in ${delayMs}ms...`);
                setTimeout(() => this.dispatch(jobId), delayMs);
            }
            else {
                job.status = notification_model_1.NotificationStatus.FAILED;
                this.logger.error(`[Dispatch] ✗ Job ${job.id} permanently FAILED after ${MAX_ATTEMPTS} attempts.`);
            }
        }
    }
    getQueue() {
        return this.queue;
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
    interpolate(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [smtp_service_1.SmtpService,
        whatsapp_evolution_service_1.WhatsAppEvolutionService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map