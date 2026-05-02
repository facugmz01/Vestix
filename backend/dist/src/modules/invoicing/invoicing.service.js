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
let InvoicingService = class InvoicingService {
    constructor(afipService) {
        this.afipService = afipService;
        this.invoices = [];
    }
    async generateInvoice(payload) {
        const existing = this.invoices.find(i => i.orderId === payload.orderId && i.status === invoice_model_1.InvoiceStatus.APPROVED);
        if (existing) {
            throw new common_1.BadRequestException(`Order ${payload.orderId} has already been invoiced under receipt ${existing.receiptNumber}.`);
        }
        const totalAmount = payload.netAmount + payload.vatAmount;
        const invoice = {
            id: crypto.randomUUID(),
            orderId: payload.orderId,
            type: payload.type,
            customerDocumentType: payload.customerDocumentType,
            customerDocumentNumber: payload.customerDocumentNumber,
            netAmount: payload.netAmount,
            vatAmount: payload.vatAmount,
            totalAmount,
            status: invoice_model_1.InvoiceStatus.PENDING_AFIP,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.invoices.push(invoice);
        let afipInvoiceType = 6;
        if (payload.type === invoice_model_1.InvoiceType.FACTURA_A)
            afipInvoiceType = 1;
        if (payload.type === invoice_model_1.InvoiceType.NOTA_CREDITO_B)
            afipInvoiceType = 8;
        let afipDocType = 96;
        if (payload.customerDocumentType === 'CUIT')
            afipDocType = 80;
        try {
            const afipResponse = await this.afipService.createElectronicInvoice({
                pointOfSale: 1,
                invoiceType: afipInvoiceType,
                documentType: afipDocType,
                documentNumber: parseInt(payload.customerDocumentNumber, 10),
                netAmount: payload.netAmount,
                vatAmount: payload.vatAmount,
                totalAmount
            });
            invoice.cae = afipResponse.cae;
            invoice.caeExpiration = afipResponse.caeExpiration;
            invoice.receiptNumber = afipResponse.receiptNumber;
            invoice.status = invoice_model_1.InvoiceStatus.APPROVED;
            invoice.updatedAt = new Date();
        }
        catch (error) {
            invoice.status = invoice_model_1.InvoiceStatus.REJECTED;
            invoice.afipErrorMessage = error.message;
            invoice.updatedAt = new Date();
            throw new common_1.BadRequestException(`Invoicing failed: ${error.message}`);
        }
        return invoice;
    }
};
exports.InvoicingService = InvoicingService;
exports.InvoicingService = InvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [afip_service_1.AfipService])
], InvoicingService);
//# sourceMappingURL=invoicing.service.js.map