import { IsNumber, IsOptional, IsString } from 'class-validator';

/** 创建位置 DTO */
export class CreateLocationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsNumber()
  level: number;

  @IsOptional()
  @IsString()
  parent_id?: string;
}

/** 更新位置 DTO */
export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
