import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateBranchConfigDto } from './dto/update-branch-config.dto';
export declare class BranchesService {
    private branches;
    private configs;
    create(createBranchDto: CreateBranchDto): Promise<any>;
    findAll(activeOnly?: boolean): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<any>;
    updateConfig(branchId: string, updateConfigDto: UpdateBranchConfigDto): Promise<any>;
    assignUserToBranch(branchId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
