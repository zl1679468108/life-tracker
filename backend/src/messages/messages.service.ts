import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT } from '../common/supabase/supabase.module';
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
    @Inject(SUPABASE_ADMIN_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * 批量获取用户资料，并从 auth.users 补充 email 作为兜底
   */
  private async getUserInfoMap(userIds: string[]) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const map = new Map<
      string,
      { display_name?: string; email?: string; avatar_url?: string }
    >();
    if (uniqueIds.length === 0) return map;

    // 1. 查 life_profiles
    const { data: profiles } = await this.supabase
      .from('life_profiles')
      .select('id, display_name, email, avatar_url')
      .in('id', uniqueIds);

    for (const profile of profiles || []) {
      map.set(profile.id, {
        display_name: profile.display_name || undefined,
        email: profile.email || undefined,
        avatar_url: profile.avatar_url || undefined,
      });
    }

    // 2. 对仍缺少 email 的用户，从 auth.users 补充（兼容 admin API 创建的账号）
    const missingIds = uniqueIds.filter((id) => !map.get(id)?.email);
    if (missingIds.length > 0) {
      try {
        const { data: authUsers } = await this.supabase
          .schema('auth')
          .from('users')
          .select('id, email')
          .in('id', missingIds);

        for (const user of authUsers || []) {
          const existing = map.get(user.id) || {};
          map.set(user.id, { ...existing, email: user.email || undefined });
        }
      } catch {
        // schema('auth') 若不可用也不影响主流程
      }
    }

    return map;
  }

  /** 清洗 PostgREST ilike / or 过滤片段，避免特殊字符破坏过滤语法 */
  private sanitizeSearchTerm(query: string, maxLen = 50): string {
    return String(query || '')
      .trim()
      .replace(/[%_,.()"'\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, maxLen)
      .trim();
  }

  private resolveDisplayName(userInfo: { display_name?: string; email?: string }) {

    return userInfo.display_name || userInfo.email?.split('@')[0] || '未知用户';
  }

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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    if (!conversations || conversations.length === 0) return [];

    // 2. 批量获取用户信息
    const otherUserIds = conversations.map(
      (conv) => conv.participant_ids.find((id: string) => id !== userId),
    );
    const userInfoMap = await this.getUserInfoMap(otherUserIds);

    // 3. 批量获取已读状态
    const conversationIds = conversations.map((conv) => conv.id);
    const { data: readStatuses } = await this.supabase
      .from('life_conversation_reads')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .in('conversation_id', conversationIds);

    const readAtMap = new Map<string, string>();
    for (const status of readStatuses || []) {
      readAtMap.set(status.conversation_id, status.last_read_at);
    }

    // 4. 批量获取每个对话的最后一条消息（避免 N+1 查询）
    // Supabase JS v2 不支持 DISTINCT ON，先按 created_at 倒序拉取，在内存中按对话去重取最新
    const lastMessageMap = new Map<string, any>();
    const { data: recentMessages } = await this.supabase
      .from('life_messages')
      .select('conversation_id, type, content, card_data, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(500);

    for (const msg of recentMessages || []) {
      // 由于已按 created_at 倒序，首次出现的对话即为该对话的最后一条消息
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    }

    // 5. 批量获取未读消息数（避免 N+1 查询）
    const unreadCountMap = new Map<string, number>();
    const convsWithReadAt = conversations.filter((c) => readAtMap.has(c.id));
    const convsWithoutReadAt = conversations.filter((c) => !readAtMap.has(c.id));

    // 5.1 无已读记录的对话：所有对方发送的消息都算未读
    if (convsWithoutReadAt.length > 0) {
      const { data: unreadMsgs } = await this.supabase
        .from('life_messages')
        .select('conversation_id')
        .in('conversation_id', convsWithoutReadAt.map((c) => c.id))
        .neq('sender_id', userId);
      for (const m of unreadMsgs || []) {
        unreadCountMap.set(m.conversation_id, (unreadCountMap.get(m.conversation_id) || 0) + 1);
      }
    }

    // 5.2 有已读记录的对话：取晚于该对话已读时间的消息
    if (convsWithReadAt.length > 0) {
      // 用所有已读时间中的最小值作为查询下界，减少拉取量；内存中再按各对话的已读时间精确过滤
      const readAtValues = convsWithReadAt.map((c) => readAtMap.get(c.id)!);
      const minReadAt = readAtValues.reduce((min, v) => (v < min ? v : min));
      const { data: unreadMsgs } = await this.supabase
        .from('life_messages')
        .select('conversation_id, created_at')
        .in('conversation_id', convsWithReadAt.map((c) => c.id))
        .neq('sender_id', userId)
        .gt('created_at', minReadAt);
      for (const m of unreadMsgs || []) {
        const convReadAt = readAtMap.get(m.conversation_id);
        // 内存中按各对话的已读时间精确过滤
        if (convReadAt && m.created_at > convReadAt) {
          unreadCountMap.set(m.conversation_id, (unreadCountMap.get(m.conversation_id) || 0) + 1);
        }
      }
    }

    // 6. 组装结果（纯内存 join，无额外查询）
    const enriched = conversations.map((conv) => {
      const otherUserId = conv.participant_ids.find((id: string) => id !== userId);
      const userInfo = userInfoMap.get(otherUserId) || {};
      const lastMsg = lastMessageMap.get(conv.id);

      return {
        ...conv,
        other_user: {
          user_id: otherUserId,
          display_name: this.resolveDisplayName(userInfo),
          avatar_url: userInfo.avatar_url || null,
        },
        last_message: lastMsg
          ? {
              type: lastMsg.type,
              content: lastMsg.content,
              card_data: lastMsg.card_data,
              created_at: lastMsg.created_at,
            }
          : null,
        unread_count: unreadCountMap.get(conv.id) || 0,
      };
    });

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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    // 批量获取发送者信息
    const senderIds = (messages || []).map((msg) => msg.sender_id);
    const userInfoMap = await this.getUserInfoMap(senderIds);

    const enriched = (messages || []).map((msg) => {
      const userInfo = userInfoMap.get(msg.sender_id) || {};
      return {
        ...convertTimesToBeijing(msg),
        sender: {
          display_name: this.resolveDisplayName(userInfo),
          avatar_url: userInfo.avatar_url || null,
        },
      };
    });

    return enriched;
  }

  /**
   * 创建对话
   */
  async createConversation(userId: string, data: CreateConversationData) {
    if (data.participant_ids.length !== 2) {
      throw new BadRequestException('对话必须恰好包含两个参与者');
    }

    // 校验发起者是参与者之一，防止创建他人之间的对话（对齐 createManualConversation）
    if (!data.participant_ids.includes(userId)) {
      throw new BadRequestException('发起者必须是对话参与者');
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    // 更新对话的最后消息信息（与消息插入构成逻辑事务：失败则回滚消息）
    const { error: convUpdateError } = await this.supabase
      .from('life_conversations')
      .update({
        last_message_type: data.type,
        last_message_content: data.content,
        last_message_at: msg.created_at,
      })
      .eq('id', conversationId);

    if (convUpdateError) {
      // 补偿：删除已插入的消息，避免消息已存但对话列表未刷新的不一致
      await this.supabase
        .from('life_messages')
        .delete()
        .eq('id', msg.id);
      throw new InternalServerErrorException('更新对话信息失败，消息已回滚');
    }

    // 获取对话参与者以推送 WebSocket 事件
    const { data: convParticipants } = await this.supabase
      .from('life_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convParticipants) {
      const participantIds = convParticipants.participant_ids;
      // 只通知对方（发送者已通过 API 响应更新本地列表）
      const receiverIds = participantIds.filter((pid) => pid !== senderId);
      this.eventsGateway.emitMessageCreated(receiverIds, msg);

      // 通知双方刷新对话列表（最后消息时间/内容已变更）
      const conv = convertTimesToBeijing(convParticipants);
      for (const pid of participantIds) {
        this.eventsGateway.emitConversationUpdated(pid, conv);
      }
    }

    return convertTimesToBeijing(msg);
  }

  /**
   * 标记对话为已读：记录当前用户在该对话的最后已读时间
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

    //  upsert 已读记录
    const { error } = await this.supabase
      .from('life_conversation_reads')
      .upsert(
        {
          user_id: userId,
          conversation_id: conversationId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,conversation_id' },
      );

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    return { code: 200, data: null, message: '标记已读成功' };
  }

  /**
   * 搜索用户（通过邮箱前缀或用户名模糊匹配）
   */
  async searchUsers(userId: string, query: string) {
    const term = this.sanitizeSearchTerm(query);
    if (!term) return [];

    const { data: profiles, error } = await this.supabase
      .from('life_profiles')
      .select('id, email, display_name, avatar_url')
      .or(`email.ilike.%${term}%,display_name.ilike.%${term}%`)
      .neq('id', userId)
      .order('display_name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    return (profiles || []).map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name || p.email?.split('@')[0] || '未知用户',
      avatar_url: p.avatar_url || null,
    }));
  }

  /**
   * 搜索消息模块：好友 + 聊天记录
   */
  async searchMessages(userId: string, query: string) {
    const term = this.sanitizeSearchTerm(query);
    if (!term) {
      return { friends: [], messages: [] };
    }

    const q = term.toLowerCase();

    // 1. 获取当前用户的所有对话
    const { data: conversations, error: convError } = await this.supabase
      .from('life_conversations')
      .select('id, participant_ids')
      .contains('participant_ids', [userId])
      .limit(200);

    if (convError) {
      console.error('对话操作失败:', convError);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    const conversationIds = (conversations || []).map((c) => c.id);
    const conversationMap = new Map((conversations || []).map((c) => [c.id, c]));

    // 2. 搜索聊天记录
    let messages: any[] = [];
    if (conversationIds.length > 0) {
      const { data: foundMessages, error: msgError } = await this.supabase
        .from('life_messages')
        .select('id, conversation_id, sender_id, type, content, created_at')
        .in('conversation_id', conversationIds)
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(30);

      if (msgError) {
        console.error('消息操作失败:', msgError);
        throw new InternalServerErrorException('操作失败，请稍后重试');
      }
      messages = foundMessages || [];
    }

    // 3. 搜索已接受好友（用户名/邮箱）
    const { data: friendships, error: friendError } = await this.supabase
      .from('life_friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendError) { console.error('查询好友失败:', friendError); throw new InternalServerErrorException('操作失败，请稍后重试'); }

    const friendIds = (friendships || []).map((row) =>
      row.requester_id === userId ? row.addressee_id : row.requester_id,
    );
    const friendInfoMap = await this.getUserInfoMap(friendIds);

    const matchedFriends = (friendships || []).filter((row) => {
      const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id;
      const info = friendInfoMap.get(friendId);
      const displayName = (info?.display_name || '').toLowerCase();
      const email = (info?.email || '').toLowerCase();
      return displayName.includes(q) || email.includes(q);
    });

    // 4. 补充消息发送者信息
    const senderIds = messages.map((m) => m.sender_id);
    const senderInfoMap = await this.getUserInfoMap(senderIds);

    const enrichedMessages = messages.map((msg) => {
      const conv = conversationMap.get(msg.conversation_id);
      const otherUserId = conv?.participant_ids?.find((id: string) => id !== userId);
      const otherInfo = otherUserId ? friendInfoMap.get(otherUserId) || senderInfoMap.get(otherUserId) || {} : {};
      const senderInfo = senderInfoMap.get(msg.sender_id) || {};
      return {
        ...convertTimesToBeijing(msg),
        conversation_id: msg.conversation_id,
        sender_name: this.resolveDisplayName(senderInfo),
        other_user_name: otherUserId ? this.resolveDisplayName(otherInfo) : '',
      };
    });

    const enrichedFriends = await Promise.all(
      matchedFriends.map((row) => this.enrichFriendship(row, userId)),
    );

    return {
      friends: enrichedFriends,
      messages: enrichedMessages,
    };
  }

  private async ensureAcceptedFriend(userId: string, friendId: string) {
    const { data, error } = await this.supabase
      .from('life_friendships')
      .select('id')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (!data) throw new BadRequestException('只能与已通过好友操作');
    return data;
  }

  private async enrichFriendship(row: any, userId: string) {
    const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id;
    const userInfoMap = await this.getUserInfoMap([friendId]);
    const userInfo = userInfoMap.get(friendId) || {};

    return {
      id: row.id,
      status: row.status as FriendshipStatus,
      friend: {
        id: friendId,
        email: userInfo.email || null,
        display_name: this.resolveDisplayName(userInfo),
        avatar_url: userInfo.avatar_url || null,
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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

    if (existingError) { console.error('查询好友申请失败:', existingError); throw new InternalServerErrorException('操作失败，请稍后重试'); }
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    const otherId = existing.requester_id === userId ? existing.addressee_id : existing.requester_id;
    const { error: sharesError } = await this.supabase
      .from('life_shares')
      .delete()
      .or(`and(owner_id.eq.${userId},shared_with_id.eq.${otherId}),and(owner_id.eq.${otherId},shared_with_id.eq.${userId})`);

    if (sharesError) { console.error('清理共享记录失败:', sharesError); throw new InternalServerErrorException('操作失败，请稍后重试'); }

    // 清理两人之间的对话及消息，避免重新加好友时复用旧对话历史
    const { data: conversations } = await this.supabase
      .from('life_conversations')
      .select('id')
      .contains('participant_ids', [userId])
      .contains('participant_ids', [otherId]);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      // life_messages 通过 conversation_id ON DELETE CASCADE，删除对话会级联删除消息
      const { error: convDeleteError } = await this.supabase
        .from('life_conversations')
        .delete()
        .in('id', conversationIds);
      if (convDeleteError) {
        console.error('清理对话失败:', convDeleteError.message);
      }
    }

    this.eventsGateway.emitFriendRequestUpdated(userId, { type: 'friend_deleted', friendship_id: friendshipId });
    this.eventsGateway.emitFriendRequestUpdated(otherId, { type: 'friend_deleted', friendship_id: friendshipId });
    return { code: 200, data: null, message: '删除好友成功' };
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

    if (error) {
      console.error('消息操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

    if (convError) {
      console.error('对话操作失败:', convError);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

      if (msgError) {
        console.error('消息操作失败:', msgError);
        throw new InternalServerErrorException('操作失败，请稍后重试');
      }

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
      this.eventsGateway.emitMessageCreated(data.participant_ids.filter((pid) => pid !== userId), createdMessage);
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

    if (convError) {
      console.error('对话操作失败:', convError);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

    if (msgError) {
        console.error('消息操作失败:', msgError);
        throw new InternalServerErrorException('操作失败，请稍后重试');
      }

    // 3. 更新对话的最后消息
    await this.supabase
      .from('life_conversations')
      .update({
        last_message_type: resourceType,
        last_message_content: `你分享了一件${resourceType === 'item' ? '物品' : '待办'}"${resourceName}"`,
        last_message_at: msg.created_at,
      })
      .eq('id', conv.id);

    // 4. 向对方推送消息事件（发送者已通过 API 响应更新本地列表）
    this.eventsGateway.emitMessageCreated([sharedWithId], msg);
    for (const pid of [ownerId, sharedWithId]) {
      this.eventsGateway.emitConversationUpdated(pid, convertTimesToBeijing(conv));
    }

    return {
      conversation: convertTimesToBeijing(conv),
      message: convertTimesToBeijing(msg),
    };
  }
}
