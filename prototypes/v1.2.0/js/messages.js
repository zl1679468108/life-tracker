// messages.js — v1.2.0 Redesigned: 社交化消息模块

const MessagePage = {
  activeConvId: null,
  _selectedFriendId: null,
  _searchQuery: '',

  init() {
    this.renderFrequentFriends();
    this.renderConversationList();
    this.bindEvents();
  },

  // 常联系好友
  renderFrequentFriends() {
    const container = document.getElementById('frequent-friends');
    const topFriends = friends.slice(0, 6);
    container.innerHTML = topFriends.map(f => `
      <div class="frequent-item" data-friend="${f.id}">
        <div class="frequent-avatar" style="background:${f.gradient}">
          ${f.display_name.charAt(0)}
          ${f.online ? '<div class="online-dot"></div>' : ''}
        </div>
        <div class="frequent-name">${f.display_name}</div>
      </div>
    `).join('');
  },

  // 对话列表
  renderConversationList() {
    const container = document.getElementById('conv-list');
    container.innerHTML = conversations.map((conv, i) => {
      const typeIcon = this.getTypeIcon(conv.lastMessageType);
      const time = this.formatTime(conv.lastMessageAt);
      const unreadClass = conv.unreadCount > 0 ? 'unread' : '';
      const online = conv.online;
      // 获取对话对方的渐变背景
      const friend = friends.find(f => f.id === conv.participantId);
      const gradient = friend ? friend.gradient : 'var(--primary-gradient)';

      return `
        <div class="conv-item ${unreadClass}" data-conv="${conv.id}" style="animation-delay:${i * 0.05}s">
          <div class="conv-avatar">
            <div class="conv-avatar-inner" style="background:${gradient}">
              ${conv.participantName.charAt(0)}
              ${online ? '<div class="online-dot"></div>' : ''}
            </div>
          </div>
          <div class="conv-info">
            <div class="conv-header">
              <span class="conv-name">${conv.participantName}</span>
              <span class="conv-time">${time}</span>
            </div>
            <div class="conv-preview">
              <span class="conv-type-icon">${typeIcon}</span>
              <span>${conv.lastMessageContent}</span>
              ${conv.unreadCount > 0 ? `<span class="conv-unread-badge">${conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  getTypeIcon(type) {
    const map = { item: '📦', todo: '✅', text: '💬', system: '🔔' };
    return map[type] || '💬';
  },

  formatTime(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 172800000) return '昨天';
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  // 打开对话详情
  openConversation(convId) {
    this.activeConvId = convId;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    conv.unreadCount = 0;
    document.querySelector(`[data-conv="${convId}"]`)?.classList.remove('unread');

    // 填充头部
    const friend = friends.find(f => f.id === conv.participantId);
    const gradient = friend ? friend.gradient : 'var(--primary-gradient)';
    document.getElementById('detail-name').textContent = conv.participantName;
    document.getElementById('detail-status').textContent = conv.online ? '在线' : '离线';
    document.getElementById('detail-status').style.color = conv.online ? 'var(--success)' : 'var(--text-muted)';
    document.getElementById('detail-avatar').style.background = gradient;
    document.getElementById('detail-avatar').textContent = conv.participantName.charAt(0);

    this.renderMessages(convId);
    document.getElementById('detail-page').classList.add('show');
  },

  renderMessages(convId) {
    const container = document.getElementById('msg-list');
    const msgs = messages[convId] || [];

    let html = '<div class="msg-divider"><span>今天</span></div>';

    html += msgs.map(msg => {
      const isSent = msg.senderId === currentUser.id;
      const isSystem = msg.type === 'system';
      const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

      if (isSystem) {
        return `<div class="msg-bubble system">${msg.content}</div>`;
      }

      if (msg.type === 'item' || msg.type === 'todo') {
        const cardIcon = msg.type === 'item' ? '📦' : '✅';
        const cardTitle = msg.cardData?.name || msg.cardData?.title || '';
        const cardBody = msg.type === 'item' && msg.cardData?.location ? msg.cardData.location : '';
        return `
          <div class="msg-card ${isSent ? 'sent' : ''}">
            <div class="msg-card-header">
              <span class="msg-card-icon">${cardIcon}</span>
              <span class="msg-card-title">${cardTitle}</span>
            </div>
            ${cardBody ? `<div class="msg-card-body">${cardBody}</div>` : ''}
            ${msg.content ? `<div style="font-size:var(--font-sm);color:var(--text-secondary);margin-top:var(--space-sm)">${msg.content}</div>` : ''}
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

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  },

  // 新建对话面板
  renderNewConvPanel() {
    const container = document.getElementById('new-conv-body');
    this._selectedFriendId = null;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg)">
        <h3 style="font-size:var(--font-xl);font-weight:700;margin:0">新建对话</h3>
        <button class="back-btn" onclick="App.hideModal('new-conv-modal')" style="width:32px;height:32px">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Tab 切换 -->
      <div class="conv-tabs">
        <button class="conv-tab active" data-tab="search" onclick="MessagePage.switchConvTab('search')">
          <span style="font-size:14px">🔍</span> 搜索用户
        </button>
        <button class="conv-tab" data-tab="friends" onclick="MessagePage.switchConvTab('friends')">
          <span style="font-size:14px">👥</span> 好友列表
        </button>
      </div>

      <!-- 搜索模式 -->
      <div id="conv-tab-search">
        <div style="position:relative;margin-bottom:var(--space-lg)">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px">🔍</span>
          <input class="input" id="new-conv-search" placeholder="搜索邮箱或用户名..." style="padding-left:36px" value="${this._searchQuery}">
        </div>
        <div id="search-results"></div>
      </div>

      <!-- 好友模式 -->
      <div id="conv-tab-friends" style="display:none">
        <div class="section-label">我的好友 (${friends.length})</div>
        <div class="friend-grid" id="friend-list"></div>
      </div>

      <!-- 添加好友区域 -->
      <div class="add-friend-section">
        <h4>➕ 添加好友</h4>
        <div style="position:relative;margin-bottom:var(--space-md)">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px">👤</span>
          <input class="input" id="add-friend-input" placeholder="输入对方邮箱添加好友..." style="padding-left:36px">
        </div>
        <button class="btn btn-gradient" id="add-friend-btn" style="width:100%">添加好友</button>
      </div>

      <!-- 创建按钮 -->
      <div style="margin-top:var(--space-xl)">
        <button class="btn btn-gradient" id="start-chat-btn" style="width:100%" disabled>发起对话</button>
      </div>
    `;

    this.bindNewConvEvents();
  },

  switchConvTab(tab) {
    document.querySelectorAll('.conv-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.getElementById('conv-tab-search').style.display = tab === 'search' ? 'block' : 'none';
    document.getElementById('conv-tab-friends').style.display = tab === 'friends' ? 'block' : 'none';

    if (tab === 'friends') {
      this.renderFriendList();
    }
  },

  renderFriendList() {
    const container = document.getElementById('friend-list');
    if (!container) return;
    container.innerHTML = friends.map(f => `
      <div class="friend-card" data-friend="${f.id}">
        <div class="avatar" style="background:${f.gradient};color:white;width:48px;height:48px;font-size:var(--font-lg);font-weight:700;border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;">
          ${f.display_name.charAt(0)}
        </div>
        <div class="friend-name">${f.display_name}</div>
      </div>
    `).join('');
  },

  bindNewConvEvents() {
    // 搜索过滤
    const searchInput = document.getElementById('new-conv-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this._searchQuery = searchInput.value.toLowerCase();
        this.renderSearchResults();
      });
      // 初始渲染
      this.renderSearchResults();
    }

    // 好友选择
    document.querySelectorAll('.friend-card').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.friend-card').forEach(e => e.style.outline = '');
        el.style.outline = '2px solid var(--primary)';
        el.style.outlineOffset = '2px';
        this._selectedFriendId = el.dataset.friend;
        this.updateStartBtn();
      });
    });

    // 搜索结果选择
    document.querySelectorAll('[data-user]').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('[data-user]').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        this._selectedFriendId = el.dataset.user;
        this.updateStartBtn();
      });
    });

    // 添加好友
    const addBtn = document.getElementById('add-friend-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const input = document.getElementById('add-friend-input');
        const email = input?.value.trim();
        if (email) {
          App.showToast(`已向 ${email} 发送好友请求`, 'success');
          input.value = '';
        }
      });
    }

    // 发起对话
    const startBtn = document.getElementById('start-chat-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (this._selectedFriendId) {
          const friend = friends.find(f => f.id === this._selectedFriendId);
          App.hideModal('new-conv-modal');
          App.showToast(`与 ${friend?.display_name || '好友'} 的对话已创建`, 'success');
          // 实际场景中会创建新对话并跳转
        }
      });
    }
  },

  renderSearchResults() {
    const container = document.getElementById('search-results');
    if (!container) return;

    const q = this._searchQuery;
    // 搜索所有用户（包括好友和推荐）
    const allUsers = [...friends, ...suggestedUsers];
    const results = q
      ? allUsers.filter(u => u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : allUsers;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-2xl)">
          <div class="empty-icon">🔍</div>
          <h3>未找到用户</h3>
          <p>试试其他搜索词或添加好友</p>
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(u => {
      const isFriend = friends.some(f => f.id === u.id);
      return `
        <div class="user-search-result" data-user="${u.id}">
          <div class="avatar" style="background:${u.gradient};color:white;width:40px;height:40px;font-size:var(--font-base);font-weight:700">
            ${u.display_name.charAt(0)}
          </div>
          <div class="user-search-info">
            <div class="user-search-name">${u.display_name}${isFriend ? ' <span class="badge badge-success" style="margin-left:4px">好友</span>' : ''}</div>
            <div class="user-search-email">${u.email}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  updateStartBtn() {
    const btn = document.getElementById('start-chat-btn');
    if (btn) {
      btn.disabled = !this._selectedFriendId;
      btn.style.opacity = this._selectedFriendId ? '1' : '0.5';
    }
  },

  sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input?.value.trim();
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

  bindEvents() {
    // 对话列表点击
    document.getElementById('conv-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-conv]');
      if (item) {
        this.openConversation(item.dataset.conv);
      }
    });

    // 常联系好友点击
    document.getElementById('frequent-friends').addEventListener('click', (e) => {
      const item = e.target.closest('[data-friend]');
      if (item) {
        // 找到对应的对话并打开
        const conv = conversations.find(c => c.participantId === item.dataset.friend);
        if (conv) {
          this.openConversation(conv.id);
        }
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
};

window.messagePage = MessagePage;
