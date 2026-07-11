import { IsEnum, IsOptional, IsString } from 'class-validator';

/** 分类类型枚举 */
enum CategoryType {
  ITEM = 'item',
  TODO = 'todo',
}

/** 创建分类 DTO */
export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsEnum(CategoryType, { message: 'type 必须是 item 或 todo' })
  type: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}

/** 更新分类 DTO */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
