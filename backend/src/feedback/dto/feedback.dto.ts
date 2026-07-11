import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** 创建反馈 DTO */
export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: '反馈内容不能为空' })
  content: string;

  @IsOptional()
  @IsString()
  contact?: string;
}
