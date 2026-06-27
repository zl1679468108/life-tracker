// settings.js — 设置页交互逻辑

const SettingsPage = {
  init() {
    this.renderSettings();
    this.bindEvents();
  },

  renderSettings() {
    // 个人信息
    document.getElementById('profile-name').textContent = currentUser.display_name;
    document.getElementById('profile-email').textContent = currentUser.email;

    // 设置分组
    const container = document.getElementById('settings-groups');
    const groups = [
      {
        title: '数据管理',
        items: [
          { icon: '🔄', cls: 'blue', title: '数据同步', subtitle: '手动同步到云端' },
          { icon: '💾', cls: 'green', title: '数据备份', subtitle: '备份与恢复' },
          { icon: '📤', cls: 'orange', title: '导出数据', subtitle: 'JSON / CSV' },
        ],
      },
      {
        title: '偏好设置',
        items: [
          { icon: '🌙', cls: 'purple', title: '深色模式', subtitle: '', toggle: true, checked: false },
          { icon: '🌐', cls: 'blue', title: '语言', subtitle: '简体中文' },
          { icon: '🔔', cls: 'orange', title: '通知设置', subtitle: '推送与提醒' },
        ],
      },
      {
        title: '关于',
        items: [
          { icon: 'ℹ️', cls: '', title: '版本信息', subtitle: 'v1.2.0-draft' },
          { icon: '💡', cls: 'green', title: '反馈建议', subtitle: '帮助我们改进' },
          { icon: '❓', cls: 'blue', title: '帮助中心', subtitle: '使用指南与 FAQ' },
        ],
      },
    ];

    container.innerHTML = groups.map(g => `
      <div class="settings-group">
        <div class="settings-group-title">${g.title}</div>
        <div class="settings-list">
          ${g.items.map(item => `
            <div class="settings-item" data-setting="${item.title}">
              <div class="setting-icon ${item.cls}">${item.icon}</div>
              <div class="setting-info">
                <div class="setting-title">${item.title}</div>
                ${item.subtitle ? `<div class="setting-subtitle">${item.subtitle}</div>` : ''}
              </div>
              ${item.toggle ? `<div class="toggle-switch" data-toggle="${item.title}"></div>` : '<span class="setting-arrow">›</span>'}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // 版本
    document.getElementById('version-num').textContent = 'v1.2.0-draft';
  },

  bindEvents() {
    // 设置项点击
    document.getElementById('settings-groups').addEventListener('click', (e) => {
      const item = e.target.closest('.settings-item');
      if (!item) return;
      const title = item.dataset.setting;

      // 检查是否是 toggle
      const toggle = item.querySelector('.toggle-switch');
      if (toggle) {
        toggle.classList.toggle('on');
        App.showToast(`${title} 已${toggle.classList.contains('on') ? '开启' : '关闭'}`);
        return;
      }

      const messages = {
        '数据同步': '数据同步功能开发中',
        '数据备份': '备份与恢复功能开发中',
        '导出数据': '导出功能开发中',
        '语言': '语言设置: 简体中文',
        '通知设置': '通知设置页面开发中',
        '版本信息': 'LifeTracker v1.2.0-draft\n技术栈: React Native + NestJS + Supabase',
        '反馈建议': '反馈功能开发中',
        '帮助中心': '帮助中心页面开发中',
      };
      App.showToast(messages[title] || '功能开发中');
    });

    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) {
        App.showToast('已退出登录');
      }
    });
  },
};

window.settingsPage = SettingsPage;
