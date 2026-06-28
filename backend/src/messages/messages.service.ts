import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';
import { EventsGateway } from '../common/events/events.gateway';

interface CreateConversationData {
  participant_ids: string[];
  last_message_type?: string;
  last_message_content?: string;
  last_message_at?: string;
}

interface CreateMessageData {
  type: string;
  resource_type?: string;
  resource_id?: string;
  content?: string;
  card_data?: any;
}

type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * 获取当前用户参与的对话列表（按最后消息时间排序）
   */
  async findConversations(userId: string) {
    // 1. 获取对话
    const { data: conversations, error } = await this.supabase
      .from('life_conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) throw new InternalServerErrorException(error.message);

    if (!conversations || conversations.length === 0) return [];

    // 2. 获取每个对话的最后一条消息和对方用户信息
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant_ids.find((id: string) => id !== userId);

        // 获取对方用户资料
        const { data: profile } = await this.supabase
          .from('life_profiles')
          .select('display_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        // 获取最后一条消息
        const { data: lastMsg } = await this.supabase
          .from('life_messages')
          .select('type, content, card_data, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // 计算未读数
        const { count: unreadCount } = await this.supabase
          .from('life_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_id', otherUserId);

        return {
          ...conv,
          other_user: {
            user_id: otherUserId,
            display_name: profile?.display_name || '未知用户',
            avatar_url: profile?.avatar_url || null,
          },
          last_message: lastMsg ? {
            type: lastMsg.type,
            content: lastMsg.content,
            card_data: lastMsg.card_data,
            created_at: lastMsg.created_at,
          } : null,
          unread_count: unreadCount || 0,
        };
      }),
    );

    return enriched;
  }

  /**
   * 获取对话内的消息列表
   */
  async findMessages(conversationId: string, userId: string, limit: number = 50, before?: string) {
    // 验证是否为对话参与者
    const { data: conv } = await this.supabase
      .from('life_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();

    if (!conv || !conv.participant_ids.includes(userId)) {
      throw new NotFoundException('对话不存在或无权限访问');
    }

    let query = this.supabase
      .from('life_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query.limit(limit);

    if (error) throw new InternalServerErrorException(error.message);

    // 获取发送者信息
    const enriched = await Promise.all(
      (messages || []).map(async (msg) => {
        const { data: profile } = await this.supabase
          .from('life_profiles')
          .select('display_name, avatar_url')
          .eq('id', msg.sender_id)
          .single();

        return {
          ...convertTimesToBeijing(msg),
          sender: {
            display_name: profile?.display_name || '未知用户',
            avatar_url: profile?.avatar_url || null,
          },
        };
      }),
    );

    return enriched;
  }

  /**
   * 创建对话
   */
  async createConversation(userId: string, data: CreateConversationData) {
    if (data.participant_ids.length !== 2) {
      throw new BadRequestException('对话必须恰好包含两个参与者');
    }

    const { data: conv, error } = await this.supabase
      .from('life_conversations')
      .insert({
        participant_ids: data.participant_ids,
        last_message_type: data.last_message_type,
        last_message_content: data.last_message_content,
        last_message_at: data.last_message_at,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return convertTimesToBeijing(conv);
  }

  /**
   * 创建消息
   */
  async createMessage(conversationId: string, senderId: string, data: CreateMessageData) {
    // 验证是否为对话参与者
    const { data: conv } = await this.supabase
      .from('life_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();

    if (!conv || !conv.participant_ids.includes(senderId)) {
      throw new NotFoundException('对话不存在或无权限发送消息');
    }

    const { data: msg, error } = await this.supabase
      .from('life_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        type: data.type,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        content: data.content,
        card_data: data.card_data,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // 更新对话的最后消息信息
    await this.supabase
      .from('life_conversations')
      .update({
        last_message_type: data.type,
        last_message_content: data.content,
        last_message_at: msg.created_at,
      })
      .eq('id', conversationId);

    // 获取对话参与者以推送 WebSocket 事件
    const { data: convParticipants } = await this.supabase
      .from('life_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();

    if (convParticipants) {
      const participantIds = convParticipants.participant_ids;
      // 通知对话中所有参与者
      for (const pid of participantIds) {
        this.eventsGateway.emitMessageCreated(conversationId, msg);
      }
    }

    return convertTimesToBeijing(msg);
  }

  /**
   * 标记对话为已读（通过创建一条系统消息记录阅读时间）
   * 简化方案：返回成功即可，未读数由前端本地管理
   */
  async markAsRead(conversationId: string, userId: string) {
    // 验证权限
    const { data: conv } = await this.supabase
      .from('life_conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();

    if (!conv || !conv.participant_ids.includes(userId)) {
      throw new NotFoundException('对话不存在或无权限');
    }

    return { success: true };
  }

  /**
   * 搜索用户（通过邮箱前缀或用户名模糊匹配）
   */
  async searchUsers(userId: string, query: string) {
    if (!query || query.length < 1) return [];

    const { data: profiles, error } = await this.supabase
      .from('life_profiles')
      .select('id, email, display_name, avatar_url')
      .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', userId)
      .order('display_name', { ascending: true })
      .limit(20);

    if (error) throw new InternalServerErrorException(error.message);

    return (profiles || []).map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name || p.email?.split('@')[0] || '未知用户',
      avatar_url: p.avatar_url || null,
    }));
  }

  private async ensureAcceptedFriend(userId: string, friendId: string) {
    const { data, error } = await this.supabase
      .from('life_friendships')
      .select('id')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new BadRequestException('只能与已通过好友操作');
    return data;
  }

  private async enrichFriendship(row: any, userId: string) {
    const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id;
    const { data: profile } = await this.supabase
      .from('life_profiles')
      .select('id, email, display_name, avatar_url')
      .eq('id', friendId)
      .single();

    return {
      id: row.id,
      status: row.status as FriendshipStatus,
      friend: {
        id: friendId,
        email: profile?.email || null,
        display_name: profile?.display_name || profile?.email?.split('@')[0] || '未知用户',
        avatar_url: profile?.avatar_url || null,
      },
      pinned: row.requester_id === userId ? row.requester_pinned : row.addressee_pinned,
      request_message: row.request_message || null,
      direction: row.requester_id === userId ? 'outgoing' : 'incoming',
      created_at: row.created_at,
      updated_at: row.updated_at,
      responded_at: row.responded_at,
    };
  }

  async findFriends(userId: string) {
    const { data, error } = await this.supabase
      .from('life_friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    const friends = await Promise.all((data || []).map((row) => this.enrichFriendship(row, userId)));
    return friends.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }

  async findFriendRequests(userId: string) {
    const { data, error } = await this.supabase
      .from('life_friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return Promise.all((data || []).map((row) => this.enrichFriendship(row, userId)));
  }

  async sendFriendRequest(userId: string, targetUserId: string, message?: string) {
    if (!targetUserId || targetUserId === userId) {
      throw new BadRequestException('不能添加自己为好友');
    }

    const { data: existing, error: existingError } = await this.supabase
      .from('life_friendships')
      .select('*')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)
      .maybeSingle();

    if (existingError) throw new InternalServerErrorException(existingError.message);
    if (existing) {
      if (existing.status === 'accepted') throw new BadRequestException('已经是好友');
      if (existing.status === 'pending') throw new BadRequestException('好友申请已发送');
    }

    const { data, error } = await this.supabase
      .from('life_friendships')
      .insert({
        requester_id: userId,
        addressee_id: targetUserId,
        request_message: message,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    this.eventsGateway.emitFriendRequestUpdated(targetUserId, { type: 'request_created', friendship_id: data.id });
    return this.enrichFriendship(data, userId);
  }

  async respondFriendRequest(userId: string, friendshipId: string, action: 'accept' | 'reject') {
    const { data: existing, error: findError } = await this.supabase
      .from('life_friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .single();

    if (findError || !existing) throw new NotFoundException('好友申请不存在或无权限处理');

    const status: FriendshipStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data, error } = await this.supabase
      .from('life_friendships')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (status === 'accepted') {
      await this.createOrGetFriendConversation(existing.requester_id, existing.addressee_id);
    }

    this.eventsGateway.emitFriendRequestUpdated(existing.requester_id, { type: `request_${status}`, friendship_id: friendshipId });
    this.eventsGateway.emitFriendRequestUpdated(existing.addressee_id, { type: `request_${status}`, friendship_id: friendshipId });
    return this.enrichFriendship(data, userId);
  }

  async setFriendPinned(userId: string, friendshipId: string, pinned: boolean) {
    const { data: existing, error: findError } = await this.supabase
      .from('life_friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('status', 'accepted')
      .single();

    if (findError || !existing || (existing.requester_id !== userId && existing.addressee_id !== userId)) {
      throw new NotFoundException('好友关系不存在或无权限操作');
    }

    const field = existing.requester_id === userId ? 'requester_pinned' : 'addressee_pinned';
    const { data, error } = await this.supabase
      .from('life_friendships')
      .update({ [field]: pinned })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return this.enrichFriendship(data, userId);
  }

  async deleteFriend(userId: string, friendshipId: string) {
    const { data: existing, error: findError } = await this.supabase
      .from('life_friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('status', 'accepted')
      .single();

    if (findError || !existing || (existing.requester_id !== userId && existing.addressee_id !== userId)) {
      throw new NotFoundException('好友关系不存在或无权限操作');
    }

    const { error } = await this.supabase
      .from('life_friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw new InternalServerErrorException(error.message);

    const otherId = existing.requester_id === userId ? existing.addressee_id : existing.requester_id;
    this.eventsGateway.emitFriendRequestUpdated(userId, { type: 'friend_deleted', friendship_id: friendshipId });
    this.eventsGateway.emitFriendRequestUpdated(otherId, { type: 'friend_deleted', friendship_id: friendshipId });
    return { success: true };
  }

  private async createOrGetFriendConversation(userA: string, userB: string) {
    const { data: existing } = await this.supabase
      .from('life_conversations')
      .select('id')
      .contains('participant_ids', [userA])
      .contains('participant_ids', [userB])
      .maybeSingle();

    if (existing) return existing;

    const { data: conv, error } = await this.supabase
      .from('life_conversations')
      .insert({
        participant_ids: [userA, userB],
        last_message_type: 'system',
        last_message_content: '你们已成为好友',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    await this.supabase
      .from('life_messages')
      .insert({
        conversation_id: conv.id,
        sender_id: userA,
        type: 'system',
        content: '你们已成为好友',
      });

    this.eventsGateway.emitConversationUpdated(userA, convertTimesToBeijing(conv));
    this.eventsGateway.emitConversationUpdated(userB, convertTimesToBeijing(conv));
    return conv;
  }

  /**
   * 手动创建对话（供用户主动发起）
   */
  async createManualConversation(
    userId: string,
    data: { participant_ids: string[]; initial_message?: { type: string; content?: string; card_data?: any } },
  ) {
    if (data.participant_ids.length !== 2) {
      throw new BadRequestException('对话必须恰好包含两个参与者');
    }

    // 验证发起者是参与者之一
    if (!data.participant_ids.includes(userId)) {
      throw new BadRequestException('发起者必须是对话参与者');
    }

    const otherUserId = data.participant_ids.find((id) => id !== userId);
    await this.ensureAcceptedFriend(userId, otherUserId);

    // 检查是否已存在相同参与者的对话
    const { data: existing } = await this.supabase
      .from('life_conversations')
      .select('id')
      .contains('participant_ids', [userId])
      .contains('participant_ids', data.participant_ids.filter((id) => id !== userId)[0]);

    if (existing && existing.length > 0) {
      throw new BadRequestException('与该用户的对话已存在');
    }

    // 创建对话
    const { data: conv, error: convError } = await this.supabase
      .from('life_conversations')
      .insert({
        participant_ids: data.participant_ids,
      })
      .select()
      .single();

    if (convError) throw new InternalServerErrorException(convError.message);

    // 如果有首条消息，创建它
    let createdMessage = null;
    if (data.initial_message) {
      const { data: msg, error: msgError } = await this.supabase
        .from('life_messages')
        .insert({
          conversation_id: conv.id,
          sender_id: userId,
          type: data.initial_message.type,
          content: data.initial_message.content,
          card_data: data.initial_message.card_data,
        })
        .select()
        .single();

      if (msgError) throw new InternalServerErrorException(msgError.message);

      // 更新对话的最后消息
      await this.supabase
        .from('life_conversations')
        .update({
          last_message_type: data.initial_message.type,
          last_message_content: data.initial_message.content,
          last_message_at: msg.created_at,
        })
        .eq('id', conv.id);

      createdMessage = convertTimesToBeijing(msg);

      // 推送 WebSocket 事件
      this.eventsGateway.emitMessageCreated(conv.id, createdMessage);
      for (const pid of data.participant_ids) {
        this.eventsGateway.emitConversationUpdated(pid, convertTimesToBeijing(conv));
      }
    }

    return {
      conversation: convertTimesToBeijing(conv),
      message: createdMessage,
    };
  }

  /**
   * 分享时自动创建对话 + 消息（供 shares 模块调用）
   */
  async createFromShare(
    ownerId: string,
    sharedWithId: string,
    resourceType: 'item' | 'todo',
    resourceId: string,
    resourceName: string,
  ) {
    // 1. 创建对话
    const { data: conv, error: convError } = await this.supabase
      .from('life_conversations')
      .insert({
        participant_ids: [ownerId, sharedWithId],
      })
      .select()
      .single();

    if (convError) throw new InternalServerErrorException(convError.message);

    // 2. 创建卡片消息（发给对方）
    const cardData = {
      resource_type: resourceType,
      resource_id: resourceId,
      name: resourceName,
    };

    const { data: msg, error: msgError } = await this.supabase
      .from('life_messages')
      .insert({
        conversation_id: conv.id,
        sender_id: ownerId,
        type: resourceType,
        resource_type: resourceType,
        resource_id: resourceId,
        content: `你分享了一件${resourceType === 'item' ? '物品' : '待办'}"${resourceName}"`,
        card_data: cardData,
      })
      .select()
      .single();

    if (msgError) throw new InternalServerErrorException(msgError.message);

    // 3. 更新对话的最后消息
    await this.supabase
      .from('life_conversations')
      .update({
        last_message_type: resourceType,
        last_message_content: `你分享了一件${resourceType === 'item' ? '物品' : '待办'}"${resourceName}"`,
        last_message_at: msg.created_at,
      })
      .eq('id', conv.id);

    // 4. 向双方推送消息事件
    this.eventsGateway.emitMessageCreated(conv.id, msg);
    for (const pid of [ownerId, sharedWithId]) {
      this.eventsGateway.emitConversationUpdated(pid, convertTimesToBeijing(conv));
    }

    return {
      conversation: convertTimesToBeijing(conv),
      message: convertTimesToBeijing(msg),
    };
  }
}
