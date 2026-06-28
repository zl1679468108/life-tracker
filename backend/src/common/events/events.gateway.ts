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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3021',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  // userId -> socketId 映射，方便后续扩展
  private userSocketMap = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // 清理映射
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        break;
      }
    }
  }

  // 客户端连接后加入用户房间
  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    if (userId) {
      client.join(`user:${userId}`);
      this.userSocketMap.set(userId, client.id);
      this.logger.log(`Client ${client.id} joined room user:${userId}`);
    }
  }

  // 客户端离开用户房间
  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    if (userId) {
      client.leave(`user:${userId}`);
      this.userSocketMap.delete(userId);
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

  emitMessageCreated(conversationId: string, message: any) {
    // 对话中双方都收到新消息通知
    this.server.to(`conversation:${conversationId}`).emit('messages:new', message);
  }

  emitConversationUpdated(userId: string, conversation: any) {
    // 更新对话列表（用于前端刷新列表）
    this.server.to(`user:${userId}`).emit('conversations:updated', conversation);
  }

  emitFriendRequestUpdated(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('friends:request-updated', payload);
  }
}
