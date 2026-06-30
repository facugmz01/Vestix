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
exports.RbacContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("../rbac.service");
let RbacContextMiddleware = class RbacContextMiddleware {
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    async use(req, res, next) {
        const user = req.user;
        if (user && user.roleId) {
            try {
                const permissions = await this.rbacService.getPermissionsForRole(user.roleId);
                req.permissions = permissions;
            }
            catch (error) {
                console.error('Failed to load RBAC context', error);
            }
        }
        next();
    }
};
exports.RbacContextMiddleware = RbacContextMiddleware;
exports.RbacContextMiddleware = RbacContextMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacContextMiddleware);
//# sourceMappingURL=rbac-context.middleware.js.map