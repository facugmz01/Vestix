"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalHttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalHttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GlobalHttpExceptionFilter = GlobalHttpExceptionFilter_1 = class GlobalHttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalHttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const isProduction = process.env.NODE_ENV === 'production';
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected error occurred.';
        let errorCode = 'INTERNAL_SERVER_ERROR';
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'string') {
                message = body;
            }
            else if (typeof body === 'object' && body !== null) {
                const b = body;
                message = b.message ?? message;
                errorCode = b.error ?? common_1.HttpStatus[statusCode];
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    statusCode = common_1.HttpStatus.CONFLICT;
                    message = 'Ya existe un registro con esos datos únicos (ej: SKU, Email, Nombre).';
                    errorCode = 'UNIQUE_CONSTRAINT_FAILED';
                    break;
                case 'P2003':
                    statusCode = common_1.HttpStatus.BAD_REQUEST;
                    message = 'No se puede eliminar o modificar el registro porque está siendo referenciado por otros datos (ej: variantes, órdenes, movimientos).';
                    errorCode = 'FOREIGN_KEY_CONSTRAINT_FAILED';
                    break;
                case 'P2025':
                    statusCode = common_1.HttpStatus.NOT_FOUND;
                    message = 'El registro solicitado no existe.';
                    errorCode = 'RECORD_NOT_FOUND';
                    break;
                default:
                    statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                    message = `Error de base de datos no manejado (${exception.code})`;
                    errorCode = 'DATABASE_ERROR';
            }
        }
        else if (exception instanceof Error) {
            this.logger.error(`[Unhandled Exception] ${exception.message}`, isProduction ? undefined : exception.stack, `${request.method} ${request.url}`);
        }
        if (statusCode >= 500) {
            this.logger.error(`[${statusCode}] ${request.method} ${request.url} — ${String(message)}`);
        }
        else if (statusCode >= 400) {
            this.logger.warn(`[${statusCode}] ${request.method} ${request.url} — ${String(message)}`);
        }
        response.status(statusCode).json({
            statusCode,
            errorCode,
            message,
            path: request.url,
            timestamp: new Date().toISOString(),
            ...(isProduction ? {} : {
                stack: exception instanceof Error ? exception.stack : undefined,
            }),
        });
    }
};
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter;
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter = GlobalHttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalHttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map