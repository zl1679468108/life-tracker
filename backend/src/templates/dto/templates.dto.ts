import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

/** 模板类型 */
type TemplateType = 'item' | 'todo';

/** 创建模板 DTO */
export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['item', 'todo'], { message: 'template_type 必须是 item 或 todo' })
  template_type: TemplateType;

  @IsObject()
  data: Record<string, any>;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

/** 更新模板 DTO */
export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

/** 使用模板 DTO */
export class UseTemplateDto {
  @IsOptional()
  @IsObject()
  overrides?: Record<string, any>;
}
