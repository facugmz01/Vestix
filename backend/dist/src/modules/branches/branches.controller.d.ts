import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateBranchConfigDto } from './dto/update-branch-config.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    create(createBranchDto: CreateBranchDto): Promise<any>;
    findAll(activeOnly?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<any>;
    updateConfig(id: string, updateConfigDto: UpdateBranchConfigDto): Promise<any>;
    assignUser(id: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
