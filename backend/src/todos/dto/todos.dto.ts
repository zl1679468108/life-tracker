import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/** 创建待办 DTO */
export class CreateTodoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsDateString()
  reminder_date?: string;

  @IsOptional()
  @IsString()
  notification_id?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

/** 更新待办 DTO（所有字段可选） */
export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsDateString()
  reminder_date?: string;

  @IsOptional()
  @IsString()
  notification_id?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

/** 待办排序单项 DTO */
export class ReorderItemDto {
  @IsString()
  id: string;

  @IsNumber()
  sort_order: number;
}
