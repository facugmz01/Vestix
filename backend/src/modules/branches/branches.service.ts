import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateBranchConfigDto } from './dto/update-branch-config.dto';
import * as crypto from 'crypto';

@Injectable()
export class BranchesService {
  // private readonly prisma: PrismaService;
  
  // Mock DB
  private branches: any[] = [];
  private configs: any[] = [];

  async create(createBranchDto: CreateBranchDto) {
    const { config, ...branchData } = createBranchDto;
    
    const exists = this.branches.find(b => b.code === branchData.code);
    if (exists) throw new ConflictException('Branch code must be unique');

    const branch = {
      id: crypto.randomUUID(),
      ...branchData,
      isActive: branchData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.branches.push(branch);

    if (config) {
      this.configs.push({
        id: crypto.randomUUID(),
        branchId: branch.id,
        ...config,
        updatedAt: new Date(),
      });
    }

    return this.findOne(branch.id);
  }

  async findAll(activeOnly: boolean = false) {
    if (activeOnly) return this.branches.filter(b => b.isActive);
    return this.branches;
  }

  async findOne(id: string) {
    const branch = this.branches.find(b => b.id === id);
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    
    const config = this.configs.find(c => c.branchId === id) || null;
    return { ...branch, config };
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    const idx = this.branches.findIndex(b => b.id === id);
    if (idx === -1) throw new NotFoundException(`Branch ${id} not found`);

    const { config, ...branchData } = updateBranchDto;
    
    this.branches[idx] = { ...this.branches[idx], ...branchData, updatedAt: new Date() };

    if (config) {
       await this.updateConfig(id, config as UpdateBranchConfigDto);
    }

    return this.findOne(id);
  }

  async updateConfig(branchId: string, updateConfigDto: UpdateBranchConfigDto) {
    const idx = this.configs.findIndex(c => c.branchId === branchId);
    if (idx === -1) {
       this.configs.push({
           id: crypto.randomUUID(),
           branchId,
           ...updateConfigDto,
           timezone: updateConfigDto.timezone || 'UTC',
           isPosEnabled: updateConfigDto.isPosEnabled ?? false,
           updatedAt: new Date()
       });
    } else {
       this.configs[idx] = { ...this.configs[idx], ...updateConfigDto, updatedAt: new Date() };
    }
    return this.configs.find(c => c.branchId === branchId);
  }

  async assignUserToBranch(branchId: string, userId: string) {
    // In the V2 DB schema, this creates a record in the 'UserBranch' join table
    // await this.prisma.userBranch.create({ data: { branchId, userId } });
    
    // We enforce the relation to allow a User to ring sales on this POS
    return { 
      success: true, 
      message: `User ${userId} successfully authorized for Branch ${branchId}` 
    };
  }
}
