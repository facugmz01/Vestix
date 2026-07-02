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
var OutboxProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxProcessorService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let OutboxProcessorService = OutboxProcessorService_1 = class OutboxProcessorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OutboxProcessorService_1.name);
        this.isProcessing = false;
    }
    async processOutboxEvents() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            const events = await this.prisma.outboxEvent.findMany({
                where: { status: 'PENDING' },
                take: 50,
                orderBy: { createdAt: 'asc' },
            });
            if (events.length === 0) {
                this.isProcessing = false;
                return;
            }
            this.logger.log(`Processing ${events.length} outbox events...`);
            for (const event of events) {
                try {
                    this.logger.debug(`Dispatching event: ${event.type} for aggregate ${event.aggregate} (${event.aggregateId})`);
                    await this.prisma.outboxEvent.update({
                        where: { id: event.id },
                        data: {
                            status: 'PROCESSED',
                            processedAt: new Date(),
                            attempts: { increment: 1 }
                        },
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to process event ${event.id}: ${error.message}`);
                    await this.prisma.outboxEvent.update({
                        where: { id: event.id },
                        data: {
                            status: 'FAILED',
                            lastError: error.message,
                            attempts: { increment: 1 }
                        },
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Outbox processing failed: ${error.message}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
};
exports.OutboxProcessorService = OutboxProcessorService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OutboxProcessorService.prototype, "processOutboxEvents", null);
exports.OutboxProcessorService = OutboxProcessorService = OutboxProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutboxProcessorService);
//# sourceMappingURL=outbox.service.js.map