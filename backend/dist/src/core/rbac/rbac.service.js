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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RbacService = class RbacService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPermissionsForRole(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: { permissions: true }
        });
        return role?.permissions || [];
    }
    async validateUserPermissions(roleId, requiredPermissions) {
        const userPermissions = await this.getPermissionsForRole(roleId);
        const isSuperAdmin = userPermissions.some(p => p.action === 'manage' && p.subject === 'all');
        if (isSuperAdmin)
            return true;
        return requiredPermissions.every(required => userPermissions.some(up => up.action === required.action && up.subject === required.subject));
    }
    async assignRoleToUser(userId, roleId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { roleId }
        });
        return true;
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map