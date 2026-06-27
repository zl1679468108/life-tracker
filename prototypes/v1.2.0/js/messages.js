// messages.js — 消息页交互逻辑

const MessagePage = {
  activeConvId: null,

  init() {
    this.renderConversationList();
    this.bindEvents();
  },

  renderConversationList() {
    const container = document.getElementById('conv-list');
    container.innerHTML = conversations.map(conv => {
      const typeIcon = this.getTypeIcon(conv.lastMessageType);
      const time = this.formatTime(conv.lastMessageAt);
      const unreadClass = conv.unreadCount > 0 ? 'unread' : '';
      return `
        <div class="conv-item ${unreadClass}" data-conv="${conv.id}">
          <div class="conv-avatar">
            <div class="avatar">${this.getAvatarEmoji(conv.participantName)}</div>
          </div>
          <div class="conv-info">
            <div class="conv-header">
              <span class="conv-name">${conv.participantName}</span>
              <span class="conv-time">${time}</span>
            </div>
            <div class="conv-preview">
              <span class="conv-type-icon">${typeIcon}</span>
              <span>${conv.lastMessageContent}</span>
              ${conv.unreadCount > 0 ? `<span class="conv-unread-badge">${conv.unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  getTypeIcon(type) {
    const map = { item: '📷', todo: '📝', text: '💬', system: '🔔' };
    return map[type] || '💬';
  },

  getAvatarEmoji(name) {
    if (name === '系统通知') return '🔔';
    const map = { '李明': '👨', '王芳': '👩', '张伟': '👨' };
    return map[name] || '👤';
  },

  formatTime(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  // 打开对话详情
  openConversation(convId) {
    this.activeConvId = convId;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    // 清除未读数
    conv.unreadCount = 0;
    document.querySelector(`[data-conv="${convId}"]`).classList.remove('unread');

    // 填充头部
    document.getElementById('detail-name').textContent = conv.participantName;
    document.getElementById('detail-status').textContent = '在线';

    // 渲染消息
    this.renderMessages(convId);

    // 显示详情页
    document.getElementById('detail-page').classList.add('show');
  },

  renderMessages(convId) {
    const container = document.getElementById('msg-list');
    const msgs = messages[convId] || [];

    container.innerHTML = msgs.map(msg => {
      const isSent = msg.senderId === currentUser.id;
      const isSystem = msg.type === 'system';
      const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

      if (isSystem) {
        return `<div class="msg-bubble system">${msg.content}</div>`;
      }

      if (msg.type === 'item' || msg.type === 'todo') {
        const cardIcon = msg.type === 'item' ? '📷' : '📝';
        const cardTitle = msg.cardData?.name || msg.cardData?.title || '';
        const cardBody = msg.type === 'item' && msg.cardData?.location
          ? msg.cardData.location : '';
        return `
          <div class="msg-card ${isSent ? 'sent' : ''}">
            <div class="msg-card-header">
              <span class="msg-card-icon">${cardIcon}</span>
              <span class="msg-card-title">${cardTitle}</span>
            </div>
            ${cardBody ? `<div class="msg-card-body">${cardBody}</div>` : ''}
            <div class="msg-card-meta">
              <span class="msg-card-btn" onclick="App.showToast('跳转到详情页')">查看详情 →</span>
            </div>
          </div>
          <div class="msg-time">${time}</div>
        `;
      }

      return `
        <div class="msg-bubble ${isSent ? 'sent' : 'received'}">${msg.content}</div>
        <div class="msg-time">${time}</div>
      `;
    }).join('');

    // 滚动到底部
    container.scrollTop = container.scrollHeight;
  },

  bindEvents() {
    // 对话列表点击
    document.getElementById('conv-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-conv]');
      if (item) {
        this.openConversation(item.dataset.conv);
      }
    });

    // 返回按钮
    document.getElementById('back-btn').addEventListener('click', () => {
      document.getElementById('detail-page').classList.remove('show');
      this.activeConvId = null;
    });

    // 发送消息
    document.getElementById('send-btn').addEventListener('click', () => {
      this.sendMessage();
    });
    document.getElementById('msg-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 新建对话 FAB
    document.getElementById('fab-msg').addEventListener('click', () => {
      this.renderNewConvPanel();
      App.showModal('new-conv-modal');
    });

    // 关闭模态框
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          App.hideModal(overlay.id);
        }
      });
    });
  },

  sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || !this.activeConvId) return;

    const msgList = document.getElementById('msg-list');
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble sent';
    bubble.textContent = text;
    msgList.appendChild(bubble);

    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = time;
    msgList.appendChild(timeEl);

    input.value = '';
    msgList.scrollTop = msgList.scrollHeight;
    App.showToast('消息已发送', 'success');
  },

  renderNewConvPanel() {
    const container = document.getElementById('new-conv-body');
    const mockUsers = [
      { name: '李明', email: 'liming@example.com', avatar: '👨' },
      { name: '王芳', email: 'wangfang@example.com', avatar: '👩' },
      { name: '张伟', email: 'zhangwei@example.com', avatar: '👨' },
    ];

    container.innerHTML = `
      <h3 style="font-size:var(--font-xl);font-weight:700;margin-bottom:var(--space-lg)">新建对话</h3>
      <div class="form-group">
        <label>搜索用户</label>
        <input class="input" id="new-conv-search" placeholder="输入邮箱或用户名..." />
      </div>
      <div class="section-label" style="margin-bottom:var(--space-sm)">好友列表</div>
      <div id="user-results">
        ${mockUsers.map(u => `
          <div class="user-search-result" data-user="${u.name}">
            <div class="avatar">${u.avatar}</div>
            <div class="user-search-info">
              <div class="user-search-name">${u.name}</div>
              <div class="user-search-email">${u.email}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.hideModal('new-conv-modal')">取消</button>
        <button class="btn btn-primary" onclick="App.hideModal('new-conv-modal'); App.showToast('对话已创建', 'success')">发起对话</button>
      </div>
    `;

    // 用户选择
    container.querySelectorAll('[data-user]').forEach(el => {
      el.addEventListener('click', () => {
        container.querySelectorAll('[data-user]').forEach(e => { e.style.background = ''; e.style.borderRadius = ''; });
        el.style.background = 'var(--primary-light)';
        el.style.borderRadius = 'var(--radius-md)';
      });
    });

    // 搜索过滤
    const searchInput = container.querySelector('#new-conv-search');
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      container.querySelectorAll('[data-user]').forEach(el => {
        const name = el.dataset.user.toLowerCase();
        el.style.display = name.includes(q) ? '' : 'none';
      });
    });
  },
};

window.messagePage = MessagePage;
