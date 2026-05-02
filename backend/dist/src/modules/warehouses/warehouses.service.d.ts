import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Warehouse } from './models/warehouse.model';
export declare class WarehousesService {
    private warehouses;
    create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse>;
    findAll(branchId?: string): Promise<Warehouse[]>;
    findOne(id: string): Promise<Warehouse>;
    update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse>;
}
