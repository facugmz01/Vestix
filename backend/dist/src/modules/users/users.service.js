"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        const adminRole = await this.prisma.role.upsert({
            where: { name: 'SUPER_ADMIN' },
            update: {},
            create: {
                name: 'SUPER_ADMIN',
                permissions: {
                    create: [
                        { action: 'manage', subject: 'all' }
                    ]
                }
            }
        });
        const adminEmail = 'admin@roindumentaria.com.ar';
        const adminExists = await this.prisma.user.findUnique({ where: { email: adminEmail } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await this.prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    roleId: adminRole.id
                }
            });
            console.log('✅ Superadmin user created: admin@roindumentaria.com.ar / Admin123!');
        }
    }
    async create(createUserDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
        if (existing) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password || 'DefaultPassword123!', 10);
        const { branchId, role, ...userData } = createUserDto;
        let dbRole = await this.prisma.role.findUnique({ where: { name: role } });
        if (!dbRole) {
            dbRole = await this.prisma.role.create({
                data: { name: role }
            });
        }
        return this.prisma.user.create({
            data: {
                email: userData.email,
                fullName: userData.fullName,
                roleId: dbRole.id,
                branchId: branchId,
                password: hashedPassword,
                isActive: userData.isActive ?? true,
            },
            select: this.userSelect(),
        });
    }
    async findAll({ page, pageSize }) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: pageSize,
                include: {
                    role: true,
                    branch: true,
                },
                orderBy: { email: 'asc' },
            }),
            this.prisma.user.count(),
        ]);
        const formattedData = data.map(u => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role?.name || 'USER',
            branchId: u.branchId,
            isActive: u.isActive,
            lastLoginAt: u.updatedAt,
            createdAt: u.createdAt,
        }));
        return { data: formattedData, total, page, pageSize };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                role: { include: { permissions: true } },
                branch: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                },
                branch: true
            }
        });
    }
    async update(id, updateUserDto) {
        await this.findOne(id);
        const { password, role, ...updateData } = updateUserDto;
        const data = { ...updateData };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }
        if (role) {
            let dbRole = await this.prisma.role.findUnique({ where: { name: role } });
            if (!dbRole) {
                dbRole = await this.prisma.role.create({ data: { name: role } });
            }
            data.roleId = dbRole.id;
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: this.userSelect(),
        });
    }
    async toggleActivation(id, isActive) {
        return this.prisma.user.update({
            where: { id },
            data: { isActive },
            select: this.userSelect(),
        });
    }
    async assignBranches(id, dto) {
        return this.prisma.user.update({
            where: { id },
            data: { branchId: dto.branchIds[0] || null },
            select: this.userSelect(),
        });
    }
    userSelect() {
        return {
            id: true,
            email: true,
            fullName: true,
            roleId: true,
            branchId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            role: true,
            branch: true,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map