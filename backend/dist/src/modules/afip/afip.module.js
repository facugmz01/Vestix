"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfipModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const afip_producer_1 = require("./afip.producer");
const afip_processor_1 = require("./afip.processor");
const afip_controller_1 = require("./afip.controller");
const prisma_module_1 = require("../../core/prisma/prisma.module");
let AfipModule = class AfipModule {
};
exports.AfipModule = AfipModule;
exports.AfipModule = AfipModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bullmq_1.BullModule.registerQueue({
                name: 'afip_invoices',
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 30000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            }),
        ],
        controllers: [afip_controller_1.AfipController],
        providers: [afip_producer_1.AfipProducer, afip_processor_1.AfipProcessor],
        exports: [afip_producer_1.AfipProducer],
    })
], AfipModule);
//# sourceMappingURL=afip.module.js.map