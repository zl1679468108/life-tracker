// settings.js — v1.2.0 Redesigned: 我的页面

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
          { icon: '🔄', cls: 'secondary', title: '数据同步', subtitle: '上次同步: 暂无数据' },
          { icon: '💾', cls: 'warning', title: '数据管理', subtitle: '备份/恢复/导入导出' },
        ],
      },
      {
        title: '偏好设置',
        items: [
          { icon: '🎨', cls: 'danger', title: '主题', subtitle: '跟随系统' },
          { icon: '🌐', cls: 'success', title: '语言', subtitle: '中文' },
        ],
      },
      {
        title: '偏好设置',
        items: [
          { icon: '🔒', cls: 'primary', title: '修改密码', subtitle: '修改登录密码' },
        ],
      },
      {
        title: '关于',
        items: [
          { icon: 'ℹ️', cls: 'gray', title: '版本', subtitle: 'v1.2.0' },
          { icon: '💡', cls: 'danger', title: '反馈建议', subtitle: '反馈建议' },
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
                <div class="setting-subtitle">${item.subtitle}</div>
              </div>
              <span class="setting-arrow">›</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // 版本
    document.getElementById('version-num').textContent = 'v1.2.0-redesigned';
  },

  bindEvents() {
    document.getElementById('settings-groups').addEventListener('click', (e) => {
      const item = e.target.closest('.settings-item');
      if (!item) return;
      const title = item.dataset.setting;

      const messages = {
        '数据同步': '数据同步功能开发中',
        '数据管理': '备份与恢复功能开发中',
        '主题': '主题设置页面开发中',
        '语言': '语言设置: 中文',
        '修改密码': '修改密码功能开发中',
        '版本': 'LifeTracker v1.2.0-redesigned\n技术栈: React Native + NestJS + Supabase',
        '反馈建议': '反馈功能开发中',
      };
      App.showToast(messages[title] || '功能开发中');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) {
        App.showToast('已退出登录');
      }
    });
  },
};

window.settingsPage = SettingsPage;
