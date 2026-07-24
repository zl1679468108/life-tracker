import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT } from '../supabase/supabase.module';

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3021')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  },
  namespace: '/',
  // 心跳检测：服务端每 10s 发送 ping，客户端 5s 内未回复 pong 则判定为死连接并清理
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  constructor(@Inject(SUPABASE_ADMIN_CLIENT) private adminClient: SupabaseClient) {}

  /**
   * 连接时校验 JWT，校验通过后自动加入用户房间。
   * token 来源优先级：handshake.auth.token > Authorization header。
   * 校验失败直接断开连接，防止未授权客户端监听事件。
   */
  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (typeof client.handshake.headers.authorization === 'string'
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined);

    if (!token) {
      this.logger.warn(`Connection rejected (no token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const { data, error } = await this.adminClient.auth.getUser(token);
      if (error || !data.user) {
        this.logger.warn(`Connection rejected (invalid token): ${client.id}`);
        client.disconnect(true);
        return;
      }
      const userId = data.user.id;
      client.data.userId = userId;
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} connected and joined user:${userId}`);
    } catch (err) {
      this.logger.warn(`Connection rejected (verify error): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 客户端可显式加入用户房间（需与已验证身份一致）
  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    const verifiedUserId = client.data.userId as string | undefined;
    if (!userId || !verifiedUserId || userId !== verifiedUserId) {
      // 拒绝加入非自身房间，防止窃听他人事件
      this.logger.warn(`Join rejected: client ${client.id} tried to join user:${userId}`);
      return;
    }
    client.join(`user:${userId}`);
    this.logger.log(`Client ${client.id} joined room user:${userId}`);
  }

  // 客户端离开用户房间
  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    const verifiedUserId = client.data.userId as string | undefined;
    if (userId && verifiedUserId && userId === verifiedUserId) {
      client.leave(`user:${userId}`);
    }
  }

  // ========== Items 事件 ==========

  emitItemCreated(userId: string, item: any) {
    this.server.to(`user:${userId}`).emit('items:created', item);
  }

  emitItemUpdated(userId: string, item: any) {
    this.server.to(`user:${userId}`).emit('items:updated', item);
  }

  emitItemDeleted(userId: string, itemId: string) {
    this.server.to(`user:${userId}`).emit('items:deleted', { id: itemId });
  }

  // ========== Todos 事件 ==========

  emitTodoCreated(userId: string, todo: any) {
    this.server.to(`user:${userId}`).emit('todos:created', todo);
  }

  emitTodoUpdated(userId: string, todo: any) {
    this.server.to(`user:${userId}`).emit('todos:updated', todo);
  }

  emitTodoDeleted(userId: string, todoId: string) {
    this.server.to(`user:${userId}`).emit('todos:deleted', { id: todoId });
  }

  // ========== Categories 事件 ==========

  emitCategoryCreated(userId: string, category: any) {
    this.server.to(`user:${userId}`).emit('categories:created', category);
  }

  emitCategoryDeleted(userId: string, categoryId: string) {
    this.server.to(`user:${userId}`).emit('categories:deleted', { id: categoryId });
  }

  // ========== Locations 事件 ==========

  emitLocationCreated(userId: string, location: any) {
    this.server.to(`user:${userId}`).emit('locations:created', location);
  }

  emitLocationDeleted(userId: string, locationId: string) {
    this.server.to(`user:${userId}`).emit('locations:deleted', { id: locationId });
  }

  // ========== Reminders 事件 ==========

  emitReminderFired(userId: string, todo: any) {
    this.server.to(`user:${userId}`).emit('reminders:fired', todo);
  }

  // ========== Messages 事件 (v1.1.0) ==========

  emitMessageCreated(participantIds: string[], message: any) {
    // 向对话中每个用户发送新消息事件
    for (const pid of participantIds) {
      this.server.to(`user:${pid}`).emit('messages:new', message);
    }
  }

  emitConversationUpdated(userId: string, conversation: any) {
    // 更新对话列表（用于前端刷新列表）
    this.server.to(`user:${userId}`).emit('conversations:updated', conversation);
  }

  emitFriendRequestUpdated(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('friends:request-updated', payload);
  }
}
