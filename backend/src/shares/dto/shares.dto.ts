import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** 资源类型枚举 */
enum ResourceType {
  ITEM = 'item',
  TODO = 'todo',
}

/** 权限枚举 */
enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
}

/** 创建共享 DTO */
export class CreateShareDto {
  @IsOptional()
  @IsString()
  shared_with_id?: string;

  @IsOptional()
  @IsString()
  shared_with_email?: string;

  @IsEnum(ResourceType, { message: 'resource_type 必须是 item 或 todo' })
  resource_type: string;

  @IsString()
  @IsNotEmpty({ message: 'resource_id 不能为空' })
  resource_id: string;

  @IsOptional()
  @IsEnum(SharePermission, { message: 'permission 必须是 view 或 edit' })
  permission?: string;
}

/** 更新共享 DTO */
export class UpdateShareDto {
  @IsEnum(SharePermission, { message: 'permission 必须是 view 或 edit' })
  permission: string;
}
