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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicingService = void 0;
const common_1 = require("@nestjs/common");
const invoice_model_1 = require("./models/invoice.model");
const afip_service_1 = require("./afip.service");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../core/prisma/prisma.service");
let InvoicingService = class InvoicingService {
    constructor(afipService, prisma) {
        this.afipService = afipService;
        this.prisma = prisma;
    }
    async generateInvoice(payload) {
        const existing = await this.getInvoiceByOrder(payload.orderId);
        if (existing) {
            throw new common_1.BadRequestException(`Order ${payload.orderId} has already been invoiced under receipt ${existing.receiptNumber}.`);
        }
        const totalAmount = payload.netAmount + payload.vatAmount;
        const invoice = await this.prisma.invoice.create({
            data: {
                id: crypto.randomUUID(),
                orderId: payload.orderId,
                type: payload.type,
                customerDocumentType: payload.customerDocumentType,
                customerDocumentNumber: payload.customerDocumentNumber,
                netAmount: payload.netAmount,
                vatAmount: payload.vatAmount,
                totalAmount,
                status: invoice_model_1.InvoiceStatus.PENDING_AFIP,
            }
        });
        let afipInvoiceType = 6;
        if (payload.type === invoice_model_1.InvoiceType.FACTURA_A)
            afipInvoiceType = 1;
        if (payload.type === invoice_model_1.InvoiceType.NOTA_CREDITO_B)
            afipInvoiceType = 8;
        let afipDocType = 96;
        if (payload.customerDocumentType === 'CUIT')
            afipDocType = 80;
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const arcaSettings = settings?.arca || {};
        const pointOfSale = parseInt(arcaSettings.pointOfSale) || 1;
        try {
            const afipResponse = await this.afipService.createElectronicInvoice({
                pointOfSale: pointOfSale,
                invoiceType: afipInvoiceType,
                documentType: afipDocType,
                documentNumber: parseInt(payload.customerDocumentNumber, 10),
                netAmount: payload.netAmount,
                vatAmount: payload.vatAmount,
                totalAmount
            });
            return await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: invoice_model_1.InvoiceStatus.APPROVED,
                    cae: afipResponse.cae,
                    caeExpiration: new Date(afipResponse.caeExpiration),
                    receiptNumber: afipResponse.receiptNumber,
                    updatedAt: new Date(),
                }
            });
        }
        catch (error) {
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: invoice_model_1.InvoiceStatus.REJECTED,
                    afipErrorMessage: error.message,
                    updatedAt: new Date(),
                }
            });
            throw new common_1.BadRequestException(`Invoicing failed: ${error.message}`);
        }
    }
    async getInvoiceByOrder(orderId) {
        return this.prisma.invoice.findFirst({
            where: { orderId, status: invoice_model_1.InvoiceStatus.APPROVED }
        });
    }
};
exports.InvoicingService = InvoicingService;
exports.InvoicingService = InvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [afip_service_1.AfipService,
        prisma_service_1.PrismaService])
], InvoicingService);
//# sourceMappingURL=invoicing.service.js.map