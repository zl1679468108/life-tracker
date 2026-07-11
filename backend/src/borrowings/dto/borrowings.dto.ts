import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

/** 借用状态枚举 */
enum BorrowingStatus {
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
}

/** 创建借用记录 DTO */
export class CreateBorrowingDto {
  @IsString()
  item_id: string;

  @IsString()
  borrower_name: string;

  @IsOptional()
  @IsString()
  borrower_contact?: string;

  @IsOptional()
  @IsDateString()
  borrow_date?: string;

  @IsOptional()
  @IsDateString()
  expected_return_date?: string;

  @IsOptional()
  @IsEnum(BorrowingStatus, { message: 'status 必须是 borrowed、returned 或 overdue' })
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/** 更新借用记录 DTO */
export class UpdateBorrowingDto {
  @IsOptional()
  @IsEnum(BorrowingStatus, { message: 'status 必须是 borrowed、returned 或 overdue' })
  status?: string;

  @IsOptional()
  @IsDateString()
  actual_return_date?: string;

  @IsOptional()
  @IsDateString()
  expected_return_date?: string;

  @IsOptional()
  @IsString()
  borrower_contact?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
