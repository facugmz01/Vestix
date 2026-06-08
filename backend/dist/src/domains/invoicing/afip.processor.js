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
var AfipProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfipProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const common_1 = require("@nestjs/common");
let AfipProcessor = AfipProcessor_1 = class AfipProcessor extends bullmq_1.WorkerHost {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.logger = new common_1.Logger(AfipProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing AFIP invoice for Order: ${job.data.orderId}`);
        const order = await this.prisma.saleOrder.findUnique({
            where: { id: job.data.orderId },
            include: { lines: true, customer: true, invoices: true }
        });
        if (!order) {
            throw new Error(`Order ${job.data.orderId} not found. Cannot invoice.`);
        }
        if (order.invoices.some(inv => inv.status === 'APPROVED')) {
            this.logger.log(`Order ${order.id} already has an approved invoice. Skipping.`);
            return { status: 'ALREADY_INVOICED' };
        }
        await new Promise(resolve => setTimeout(resolve, 2500));
        if (Math.random() < 0.1) {
            throw new Error('AFIP WSFE: Service Unavailable (503). Retrying...');
        }
        const simulatedCae = Math.floor(Math.random() * 100000000000000).toString();
        const simulatedVto = new Date();
        simulatedVto.setDate(simulatedVto.getDate() + 10);
        const receiptNumber = `B-0001-${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;
        await this.prisma.invoice.create({
            data: {
                orderId: order.id,
                type: 'FA_B',
                cae: simulatedCae,
                caeExpiration: simulatedVto,
                receiptNumber: receiptNumber,
                customerDocumentType: 'DNI',
                customerDocumentNumber: '99999999',
                netAmount: order.grandTotal / 1.21,
                vatAmount: order.grandTotal - (order.grandTotal / 1.21),
                totalAmount: order.grandTotal,
                status: 'APPROVED',
            }
        });
        this.logger.log(`Successfully generated Invoice for Order ${order.id} - CAE: ${simulatedCae}`);
        return { status: 'SUCCESS', cae: simulatedCae };
    }
};
exports.AfipProcessor = AfipProcessor;
exports.AfipProcessor = AfipProcessor = AfipProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('afip_invoices'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AfipProcessor);
//# sourceMappingURL=afip.processor.js.map