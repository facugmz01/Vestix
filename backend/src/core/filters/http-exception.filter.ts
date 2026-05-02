import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * GlobalHttpExceptionFilter
 *
 * Catches ALL exceptions (HTTP and unexpected runtime errors) and:
 * 1. Returns a consistent, safe error response body — no stack trace leakage.
 * 2. Logs the full error server-side with request context for observability.
 * 3. Distinguishes between client errors (4xx) and server faults (5xx).
 *
 * Register globally in main.ts via: app.useGlobalFilters(new GlobalHttpExceptionFilter())
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx     = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isProduction = process.env.NODE_ENV === 'production';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred.';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      statusCode  = exception.getStatus();
      const body  = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as any;
        message   = b.message  ?? message;
        errorCode = b.error    ?? HttpStatus[statusCode];
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Manejo específico de errores de Prisma
      switch (exception.code) {
        case 'P2002': // Unique constraint failed
          statusCode = HttpStatus.CONFLICT;
          message = 'Ya existe un registro con esos datos únicos (ej: SKU, Email, Nombre).';
          errorCode = 'UNIQUE_CONSTRAINT_FAILED';
          break;
        case 'P2003': // Foreign key constraint failed
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'No se puede eliminar o modificar el registro porque está siendo referenciado por otros datos (ej: variantes, órdenes, movimientos).';
          errorCode = 'FOREIGN_KEY_CONSTRAINT_FAILED';
          break;
        case 'P2025': // Record not found
          statusCode = HttpStatus.NOT_FOUND;
          message = 'El registro solicitado no existe.';
          errorCode = 'RECORD_NOT_FOUND';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Error de base de datos no manejado (${exception.code})`;
          errorCode = 'DATABASE_ERROR';
      }
    } else if (exception instanceof Error) {
      // Unexpected runtime error — log full details, never expose to client
      this.logger.error(
        `[Unhandled Exception] ${exception.message}`,
        isProduction ? undefined : exception.stack,
        `${request.method} ${request.url}`,
      );
    }

    // Log all 5xx at error level, 4xx at warn
    if (statusCode >= 500) {
      this.logger.error(`[${statusCode}] ${request.method} ${request.url} — ${String(message)}`);
    } else if (statusCode >= 400) {
      this.logger.warn(`[${statusCode}] ${request.method} ${request.url} — ${String(message)}`);
    }

    response.status(statusCode).json({
      statusCode,
      errorCode,
      message,
      path:      request.url,
      timestamp: new Date().toISOString(),
      // NEVER expose stack traces in production
      ...(isProduction ? {} : {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }
}
