"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditActor = void 0;
const common_1 = require("@nestjs/common");
exports.AuditActor = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        userId: request.user?.id ?? 'anonymous',
        userEmail: request.user?.email,
        ipAddress: request.ip,
    };
});
//# sourceMappingURL=audit-actor.decorator.js.map