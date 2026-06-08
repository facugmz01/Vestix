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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfipService = void 0;
const common_1 = require("@nestjs/common");
let AfipService = class AfipService {
    constructor() {
    }
    async createElectronicInvoice(payload) {
        try {
            const isAfipDown = false;
            if (isAfipDown) {
                throw new Error('AFIP WSFE servers are unresponsive. Timeout.');
            }
            const mockCae = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
            const mockReceiptNumber = `${payload.pointOfSale.toString().padStart(4, '0')}-${Math.floor(Math.random() * 99999999).toString().padStart(8, '0')}`;
            return {
                cae: mockCae,
                caeExpiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                receiptNumber: mockReceiptNumber
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`AFIP Integration Error: ${error.message}`);
        }
    }
};
exports.AfipService = AfipService;
exports.AfipService = AfipService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AfipService);
//# sourceMappingURL=afip.service.js.map