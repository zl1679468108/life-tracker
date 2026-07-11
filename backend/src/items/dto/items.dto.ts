import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

/** 创建物品 DTO */
export class CreateItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsBoolean()
  reminder_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  reminder_days_before?: number;

  @IsOptional()
  @IsNumber()
  purchase_price?: number;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  depreciation_rate?: number;

  @IsOptional()
  ai_suggestions?: any;

  @IsOptional()
  @IsNumber()
  ai_confidence?: number;
}

/** 更新物品 DTO（所有字段可选） */
export class UpdateItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @IsOptional()
  @IsBoolean()
  reminder_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  reminder_days_before?: number;

  @IsOptional()
  @IsNumber()
  purchase_price?: number;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  depreciation_rate?: number;

  @IsOptional()
  ai_suggestions?: any;

  @IsOptional()
  @IsNumber()
  ai_confidence?: number;
}

/** 更新物品价值 DTO */
export class UpdateValueDto {
  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsNumber()
  purchase_price?: number;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  depreciation_rate?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

/** 记录价值历史 DTO */
export class RecordValueHistoryDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
