/**
 * AuditContextService
 *
 * Uses Node.js AsyncLocalStorage to propagate the authenticated actor's
 * identity down from the HTTP request layer into the Prisma middleware,
 * without coupling them directly.
 *
 * This enables the DB layer to know WHO triggered a mutation, even deep
 * inside a service method that has no access to the original Request object.
 */
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  requestId?: string;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  /**
   * Runs the provided function within an audit context.
   * All Prisma operations triggered within `fn()` will have access
   * to the audit context via `getContext()`.
   */
  run<T>(context: AuditContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  /**
   * Retrieves the current audit context. Returns undefined if called
   * outside of a `run()` scope (e.g., background jobs).
   */
  getContext(): AuditContext | undefined {
    return this.storage.getStore();
  }
}
