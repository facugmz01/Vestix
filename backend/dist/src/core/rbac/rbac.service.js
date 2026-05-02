"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
let RbacService = class RbacService {
    constructor() {
        this.rolePermissionsCache = {
            'super-admin-uuid': [
                { action: 'manage', subject: 'all' }
            ],
            'store-manager-uuid': [
                { action: 'read', subject: 'Inventory' },
                { action: 'update', subject: 'Inventory' },
                { action: 'read', subject: 'Users' }
            ]
        };
    }
    async getPermissionsForRole(roleId) {
        return this.rolePermissionsCache[roleId] || [];
    }
    async validateUserPermissions(roleId, requiredPermissions) {
        const userPermissions = await this.getPermissionsForRole(roleId);
        const isSuperAdmin = userPermissions.some(p => p.action === 'manage' && p.subject === 'all');
        if (isSuperAdmin)
            return true;
        return requiredPermissions.every(required => userPermissions.some(up => up.action === required.action && up.subject === required.subject));
    }
    async assignRoleToUser(userId, roleId) {
        return true;
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)()
], RbacService);
//# sourceMappingURL=rbac.service.js.map