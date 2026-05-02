import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Warehouse, WarehouseType } from './models/warehouse.model';
import * as crypto from 'crypto';

// In production, we inject BranchesService to strictly validate that branchId exists in the DB
// import { BranchesService } from '../branches/branches.service'; 

@Injectable()
export class WarehousesService {
  // constructor(
  //   private readonly prisma: PrismaService,
  //   private readonly branchesService: BranchesService
  // ) {}

  private warehouses: Warehouse[] = [];

  async create(createWarehouseDto: CreateWarehouseDto) {
    // 1. Validate Code Uniqueness
    const exists = this.warehouses.some(w => w.code === createWarehouseDto.code);
    if (exists) {
      throw new ConflictException(`Warehouse with code ${createWarehouseDto.code} already exists`);
    }

    // 2. Architectural Constraint: A Store Front must belong to a physical retail branch
    if (createWarehouseDto.type === WarehouseType.STORE_FRONT && !createWarehouseDto.branchId) {
      throw new BadRequestException('A STORE_FRONT warehouse MUST be linked to a branchId');
    }

    // 3. Validation against the Branches Module (Commented for mock)
    // if (createWarehouseDto.branchId) {
    //   await this.branchesService.findOne(createWarehouseDto.branchId);
    // }

    const warehouse: Warehouse = {
      id: crypto.randomUUID(),
      ...createWarehouseDto,
      branchId: createWarehouseDto.branchId || null,
      isActive: createWarehouseDto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.warehouses.push(warehouse);
    return warehouse;
  }

  async findAll(branchId?: string) {
    // Allows querying all warehouses for a specific physical location
    if (branchId) {
      return this.warehouses.filter(w => w.branchId === branchId);
    }
    return this.warehouses;
  }

  async findOne(id: string) {
    const warehouse = this.warehouses.find(w => w.id === id);
    if (!warehouse) throw new NotFoundException(`Warehouse ${id} not found`);
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    const idx = this.warehouses.findIndex(w => w.id === id);
    if (idx === -1) throw new NotFoundException(`Warehouse ${id} not found`);

    if (updateWarehouseDto.code) {
      const exists = this.warehouses.find(w => w.code === updateWarehouseDto.code && w.id !== id);
      if (exists) throw new ConflictException(`Code ${updateWarehouseDto.code} is already taken`);
    }

    // 3. Re-validate branch link if it is being changed
    // if (updateWarehouseDto.branchId) {
    //   await this.branchesService.findOne(updateWarehouseDto.branchId);
    // }

    this.warehouses[idx] = { 
      ...this.warehouses[idx], 
      ...updateWarehouseDto, 
      updatedAt: new Date() 
    };

    return this.warehouses[idx];
  }
}
