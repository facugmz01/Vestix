import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class AssignBranchesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  branchIds: string[];
}
