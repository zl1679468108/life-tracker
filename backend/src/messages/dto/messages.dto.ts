import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/** 创建对话 DTO */
export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  participant_ids: string[];

  @IsOptional()
  @IsString()
  last_message_type?: string;

  @IsOptional()
  @IsString()
  last_message_content?: string;

  @IsOptional()
  @IsDateString()
  last_message_at?: string;
}

/** 创建消息 DTO */
export class CreateMessageDto {
  @IsString()
  @IsNotEmpty({ message: '消息类型不能为空' })
  type: string;

  @IsOptional()
  @IsString()
  resource_type?: string;

  @IsOptional()
  @IsString()
  resource_id?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  card_data?: any;
}

/** 发送好友请求 DTO */
export class SendFriendRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'target_user_id 不能为空' })
  target_user_id: string;

  @IsOptional()
  @IsString()
  message?: string;
}

/** 响应好友请求 DTO */
export class RespondFriendRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'action 不能为空' })
  action: string;
}

/** 设置好友置顶 DTO */
export class SetFriendPinnedDto {
  isPinned: boolean;
}

/** 手动创建对话的初始消息 DTO */
export class InitialMessageDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  card_data?: any;
}

/** 手动创建对话 DTO */
export class CreateManualConversationDto {
  @IsArray()
  @IsString({ each: true })
  participant_ids: string[];

  @IsOptional()
  initial_message?: InitialMessageDto;
}
