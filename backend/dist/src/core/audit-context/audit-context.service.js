"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditContextService = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
let AuditContextService = class AuditContextService {
    constructor() {
        this.storage = new async_hooks_1.AsyncLocalStorage();
    }
    run(context, fn) {
        return this.storage.run(context, fn);
    }
    getContext() {
        return this.storage.getStore();
    }
};
exports.AuditContextService = AuditContextService;
exports.AuditContextService = AuditContextService = __decorate([
    (0, common_1.Injectable)()
], AuditContextService);
//# sourceMappingURL=audit-context.service.js.map