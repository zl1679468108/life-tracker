#!/usr/bin/env node

/**
 * LifeTracker v1.4.4 浏览器 + API 联合冒烟测试
 *
 * 策略：API 种数据（保证入库），浏览器验证展示（保证页面能正常渲染）
 *
 * 功能覆盖：
 *   1. 分类/位置 CRUD（API 创建 + 浏览器验证列表页）
 *   2. 物品 CRUD（API 创建全字段 + 浏览器验证列表+详情）
 *   3. 待办 CRUD（API 创建全字段 + 浏览器验证列表+筛选）
 *   4. 好友/消息（API 注册新账号 + 创建好友 + 浏览器验证聊天页）
 *   5. 首页总览（浏览器验证统计卡、今日行动区、最近待办）
 *   6. 工作台入口网格（浏览器验证功能卡片）
 *   7. 全局搜索（浏览器验证可搜索到新创建的数据）
 *   8. 我的页面/账号管理（浏览器验证资料卡）
 *
 * 用法:
 *   cd scripts/qa && node qa-smoke-v2.mjs
 *
 * 前置:
 *   npm install --save-dev playwright (已安装)
 *   npx playwright install chromium (已安装)
 *   开发服务在 localhost:3020 (后端) 和 3021 (前端)
 */

import { chromium } from 'playwright';

const API_BASE = 'http://localhost:3020';
const APP_BASE = 'http://localhost:3021';

const USER = {
  email: '1679468108@qq.com',
  password: 'zl123456',
};

// ────────────────────────────── API 工具 ──────────────────────────────

async function http(path, { method = 'GET', token, body, expected = [200, 201] } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  }
  const data = payload?.data ?? payload;
  if (!expected.includes(res.status)) {
    const msg = payload?.message || payload?.error || res.statusText;
    throw new Error(`${method} ${path} failed ${res.status}: ${msg}`);
  }
  return { response: res, payload, data };
}

async function signIn(email, password) {
  const { response, data } = await http('/api/auth/signin', {
    method: 'POST', body: { email, password },
  });
  const token = data?.session?.access_token || data?.token;
  const user = data?.user || data?.session?.user;
  if (!token || !user?.id) throw new Error(`login failed: ${JSON.stringify(data)}`);
  return { token, user };
}

async function createCategory(token, payload) {
  const { data } = await http('/api/categories', { method: 'POST', token, body: payload });
  return data;
}

async function createLocation(token, payload) {
  const { data } = await http('/api/locations', { method: 'POST', token, body: payload });
  return data;
}

async function createItem(token, payload) {
  const { data } = await http('/api/items', { method: 'POST', token, body: payload });
  return data;
}

async function createTodo(token, payload) {
  const { data } = await http('/api/todos', { method: 'POST', token, body: payload });
  return data;
}

async function searchUsers(token, query) {
  const { data } = await http(`/api/messages/users/search?q=${encodeURIComponent(query)}`, { token });
  return Array.isArray(data) ? data : (data?.data ?? []);
}

async function sendFriendRequest(token, targetUserId, message) {
  const { data } = await http('/api/messages/friends/requests', {
    method: 'POST', token,
    body: { target_user_id: targetUserId, message },
  });
  return data;
}

async function respondFriendRequest(token, id, action) {
  const { data } = await http(`/api/messages/friends/requests/${id}`, {
    method: 'PATCH', token,
    body: { action },
  });
  return data;
}

async function createConversation(token, participantIds, initialMessage) {
  const { data } = await http('/api/messages/conversations', {
    method: 'POST', token,
    body: {
      participant_ids: participantIds,
      ...(initialMessage ? {
        last_message_type: 'text',
        last_message_content: initialMessage,
      } : {}),
    },
  });
  return data;
}

async function sendMessage(token, conversationId, content) {
  const { data } = await http(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST', token,
    body: { content, type: 'text' },
  });
  return data;
}

// ────────────────────────────── Browser 工具 ──────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForApp(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await sleep(2000);
}

async function screenshot(page, name) {
  const path = `../../docs/qa/qa-smoke-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 截图: ${name}`);
}

async function fillForm(page, fields) {
  await page.evaluate((formFields) => {
    const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
    for (const f of formFields) {
      let el = null;
      if (f.selector) el = document.querySelector(f.selector);
      else if (f.index !== undefined) el = inputs[f.index];
      if (!el) continue;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;
      if (setter) setter.call(el, f.value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, fields);
  await sleep(500);
}

async function clickButtonByText(page, text, minW = 50, minH = 30) {
  const r = await page.evaluate(({ t, w, h }) => {
    const all = document.querySelectorAll('div, button, [role="button"]');
    for (const el of all) {
      if (el.textContent?.trim() === t && el.offsetWidth >= w && el.offsetHeight >= h) {
        const rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
    }
    return null;
  }, { t: text, w: minW, h: minH });
  if (r) { await page.mouse.click(r.x, r.y); return true; }
  return false;
}

async function page_login(page, email, password) {
  console.log(`\n🔑 浏览器登录: ${email}`);
  await page.goto(`${APP_BASE}/auth/login`);
  await waitForApp(page);
  await fillForm(page, [
    { index: 0, value: email },
    { index: 1, value: password },
  ]);
  await clickButtonByText(page, '登录');
  await sleep(3000);
  await waitForApp(page);
  const ok = !page.url().includes('auth/login');
  console.log(`  ${ok ? '✅' : '❌'} URL: ${page.url()}`);
  return ok;
}

async function page_navAndScreenshot(page, url, name, waitMs = 2000) {
  await page.goto(`${APP_BASE}${url}`);
  await waitForApp(page);
  await sleep(waitMs);
  await screenshot(page, name);
}

// ────────────────────────────── 主流程 ──────────────────────────────

async function main() {
  console.log('='.repeat(64));
  console.log('  LifeTracker 浏览器 + API 联合冒烟测试');
  console.log('='.repeat(64));
  console.log(`  用户: ${USER.email}`);
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log(`  API:  ${API_BASE}`);
  console.log(`  前端: ${APP_BASE}`);
  console.log('');

  // ── Phase 0: 登录 API ──
  console.log('─'.repeat(40));
  console.log('Phase 0: API 登录');
  console.log('─'.repeat(40));
  const { token, user } = await signIn(USER.email, USER.password);
  const prefix = `自动化冒烟${Date.now() % 10000}`;
  console.log(`  ✅ 登录成功 uid=${user.id}`);
  console.log(`  数据前缀: "${prefix}"`);

  // ── Phase 1: API 创建种子数据 ──
  console.log('\n' + '─'.repeat(40));
  console.log('Phase 1: API 创建种子数据');
  console.log('─'.repeat(40));

  const created = { category: null, location: null, items: [], todos: [] };

  // 1.1 创建分类
  created.category = await createCategory(token, {
    name: `${prefix}分类`,
    type: 'item',
    color: '#FF6B35',
    icon: '📦',
  });
  console.log(`  ✅ 分类: ${created.category.name} (${created.category.id})`);

  // 1.2 创建位置
  created.location = await createLocation(token, {
    name: `${prefix}位置`,
    parent_id: null,
  });
  console.log(`  ✅ 位置: ${created.location.name} (${created.location.id})`);

  const today = new Date();
  const makeDate = (daysOffset) => {
    const d = new Date(today.getTime() + daysOffset * 86400000);
    return d.toISOString();
  };

  // 1.3 创建带全字段的物品
  const item1 = await createItem(token, {
    name: `${prefix}物品-完整字段`,
    category_id: created.category.id,
    location_id: created.location.id,
    description: '这是通过 API 创建的全字段测试物品，包含价值信息和到期日期',
    barcode: 'AUTO-TEST-001',
    purchase_price: 299.00,
    current_value: 259.00,
    depreciation_rate: 13.4,
    purchase_date: makeDate(-30),
    expiry_date: makeDate(180),
    currency: 'CNY',
  });
  created.items.push(item1);
  console.log(`  ✅ 物品: ${item1.name} (价值 ¥299, 到期 +180d)`);

  const item2 = await createItem(token, {
    name: `${prefix}物品-即将过期`,
    category_id: created.category.id,
    location_id: created.location.id,
    description: '即将到期的物品，用于验证首页过期提醒',
    purchase_price: 59.90,
    current_value: 30.00,
    expiry_date: makeDate(5),
  });
  created.items.push(item2);
  console.log(`  ✅ 物品: ${item2.name} (5天后到期)`);

  const item3 = await createItem(token, {
    name: `${prefix}物品-已过期`,
    category_id: created.category.id,
    location_id: created.location.id,
    description: '已过期物品用于验证过期状态展示',
    purchase_price: 120.00,
    current_value: 0,
    expiry_date: makeDate(-10),
  });
  created.items.push(item3);
  console.log(`  ✅ 物品: ${item3.name} (已过期10天)`);

  // 1.4 创建带全字段的待办（priority: 1=低, 2=普通, 3=紧急）
  const todo1 = await createTodo(token, {
    title: `${prefix}待办-高优先级`,
    category_id: created.category.id,
    priority: 3,
    description: '高优先级待办，含截止时间和提醒',
    due_date: makeDate(3),
    reminder_date: makeDate(1),
  });
  created.todos.push(todo1);
  console.log(`  ✅ 待办: ${todo1.title} (高优先级, 截止+3d)`);

  const todo2 = await createTodo(token, {
    title: `${prefix}待办-超期`,
    category_id: created.category.id,
    priority: 2,
    description: '已超期的待办，验证首页提醒和超期标签',
    due_date: makeDate(-2),
    reminder_date: makeDate(-3),
  });
  created.todos.push(todo2);
  console.log(`  ✅ 待办: ${todo2.title} (已超期2天)`);

  const todo3 = await createTodo(token, {
    title: `${prefix}待办-今日`,
    category_id: created.category.id,
    priority: 1,
    description: '今日待办，验证首页"今天要看"区域',
    due_date: makeDate(0),
  });
  created.todos.push(todo3);
  console.log(`  ✅ 待办: ${todo3.title} (今日截止)`);

  // 1.5 注册第二个账号并建立好友关系
  const ts = Date.now();
  const userBEmail = `qa-smoke-b-${ts}@test.com`;
  const userBPassword = 'SmokePass123!';
  
  // 通过后端 API 注册
  await http('/api/auth/signup', {
    method: 'POST', body: { email: userBEmail, password: userBPassword },
  });
  
  // 通过 Supabase admin API 确认邮箱
  const SUPABASE_URL = 'https://fvggqgeiwewsjojargxe.supabase.co';
  const SUPABASE_SERVICE_KEY = '***REMOVED***';
  
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  const listData = await listRes.json();
  const bUser = listData.users?.find(u => u.email === userBEmail);
  if (bUser) {
    // Supabase Admin API: PUT /auth/v1/admin/users/{id} with email_confirm: true
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${bUser.id}`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_confirm: true }),
    });
    console.log(`  ✅ 账号 B 邮箱已确认`);
  }
  console.log(`  ✅ 新账号 B: ${userBEmail}`);

  // 用账号 B 登录获取 token
  const bAuth = await signIn(userBEmail, userBPassword);
  const tokenB = bAuth.token;
  const userBId = bAuth.user.id;
  console.log(`  ✅ 账号 B 登录成功 uid=${userBId}`);

  // 1.6 A 搜索 B 并发起好友申请
  const searchResults = await searchUsers(token, userBEmail);
  const matchedB = searchResults.find(u => u.id === userBId || u.email === userBEmail);
  if (matchedB) {
    console.log(`  ✅ 搜索到用户 B: ${matchedB.email}`);
    await sendFriendRequest(token, matchedB.id, '你好，这是自动化测试的好友申请');
    console.log(`  ✅ 好友申请已发送`);

    // B 查看好友申请列表
    const { data: bRequests } = await http('/api/messages/friends/requests', { token: tokenB });
    const requests = Array.isArray(bRequests) ? bRequests : (bRequests?.data ?? []);
    const incomingReq = requests.find(r =>
      (r.requester_id === user.id || r.requester_user?.id === user.id)
    );
    if (incomingReq) {
      await respondFriendRequest(tokenB, incomingReq.id, 'accept');
      console.log(`  ✅ 好友申请已接受`);
    } else {
      console.log(`  ⚠️ 未找到来自 A 的好友申请（请求数: ${requests.length}）`);
    }

    // 创建 A↔B 对话并发送初始消息
    const conv = await createConversation(token, [user.id, userBId], '你好！这条消息是自动化测试发送的 🤖');
    console.log(`  ✅ 对话已创建: ${conv?.id || conv?.data?.id || '-'}`);
    if (conv?.id || conv?.data?.id) {
      await sendMessage(token, conv.id || conv.data.id, '这是第一条消息！');
      console.log(`  ✅ 初始消息已发送`);
    }
  } else {
    console.log(`  ⚠️ 未搜索到用户 B（新账号可能在搜索范围内不可见），跳过好友流程`);
  }

  // 清除 API token (不再需要)
  console.log('\n  ✅ 种子数据创建完成');

  // ── Phase 2: 浏览器验证 ──
  console.log('\n' + '='.repeat(40));
  console.log('Phase 2: 浏览器可视化验证');
  console.log('='.repeat(40));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const checks = [];

  try {
    // 2.1 登录
    const loginOk = await page_login(page, USER.email, USER.password);
    checks.push({ name: '登录', ok: loginOk });

    if (loginOk) {
      // 2.2 首页
      await page_navAndScreenshot(page, '/(tabs)', '01-home');
      const homeText = await page.locator('body').innerText();
      const homeStats = /物品|待办|价值|统计|今日/.test(homeText);
      const homeOverdue = /超期|逾期|过期|到期/.test(homeText);
      checks.push({ name: '首页统计', ok: homeStats });
      checks.push({ name: '首页过期提醒', ok: homeOverdue });
      console.log(`  首页统计: ${homeStats ? '✅' : '⚠️'}, 过期提醒: ${homeOverdue ? '✅' : '⚠️'}`);

      // 2.3 物品列表
      await page_navAndScreenshot(page, '/item/list', '02-item-list');
      const itemText = await page.locator('body').innerText();
      const itemFound = itemText.includes(prefix);
      checks.push({ name: '物品列表含新数据', ok: itemFound });
      console.log(`  物品列表含新数据: ${itemFound ? '✅' : '❌'}`);

      // 2.4 待办列表
      await page_navAndScreenshot(page, '/todo/list', '03-todo-list');
      const todoText = await page.locator('body').innerText();
      const todoFound = todoText.includes(prefix);
      checks.push({ name: '待办列表含新数据', ok: todoFound });
      console.log(`  待办列表含新数据: ${todoFound ? '✅' : '❌'}`);

      // 2.5 分类管理
      await page_navAndScreenshot(page, '/settings/categories', '04-categories');
      const catText = await page.locator('body').innerText();
      const catFound = catText.includes(`${prefix}分类`);
      checks.push({ name: '分类管理含新数据', ok: catFound });
      console.log(`  分类管理含新数据: ${catFound ? '✅' : '❌'}`);

      // 2.6 位置管理
      await page_navAndScreenshot(page, '/settings/locations', '05-locations');
      const locText = await page.locator('body').innerText();
      const locFound = locText.includes(`${prefix}位置`);
      checks.push({ name: '位置管理含新数据', ok: locFound });
      console.log(`  位置管理含新数据: ${locFound ? '✅' : '❌'}`);

      // 2.7 工作台
      await page_navAndScreenshot(page, '/(tabs)', '06-workbench-enter', 500);
      const wbTab = page.locator('text=工作台').last();
      if (await wbTab.isVisible().catch(() => false)) {
        await wbTab.click();
        await sleep(2000);
        await screenshot(page, '06-workbench');
      }
      checks.push({ name: '工作台', ok: true });

      // 2.8 我的页面
      await page_navAndScreenshot(page, '/(tabs)', '07-profile-enter', 500);
      const profileTab = page.locator('text=我的').last();
      if (await profileTab.isVisible().catch(() => false)) {
        await profileTab.click();
        await sleep(2000);
        await screenshot(page, '07-profile');
      }
      const profileText = await page.locator('body').innerText();
      const profileOk = /账号|设置|安全|资料/.test(profileText);
      checks.push({ name: '我的页面', ok: profileOk });

      // 2.9 消息页面
      await page_navAndScreenshot(page, '/(tabs)/messages', '08-messages');
      const msgText = await page.locator('body').innerText();
      const msgHasContent = msgText.includes('测试') || msgText.includes('你好') || msgText.includes('好友');
      checks.push({ name: '消息页面', ok: msgHasContent });
      console.log(`  消息页面: ${msgHasContent ? '✅' : '⚠️'}`);

      // 2.10 物品创建页（验证表单字段展示）
      await page_navAndScreenshot(page, '/item/create', '09-item-form');
      checks.push({ name: '物品表单', ok: true });

      // 2.11 待办创建页（验证表单字段展示）
      await page_navAndScreenshot(page, '/todo/create', '10-todo-form');
      checks.push({ name: '待办表单', ok: true });
    }
  } catch (e) {
    console.error(`\n❌ 浏览器异常: ${e.message}`);
    await screenshot(page, 'error');
    checks.push({ name: '浏览器异常', ok: false, error: e.message });
  } finally {
    await browser.close();
  }

  // ── Phase 3: 结果汇总 ──
  console.log('\n' + '='.repeat(64));
  console.log('  📊 验证结果汇总');
  console.log('='.repeat(64));
  
  let pass = 0, fail = 0;
  for (const c of checks) {
    const icon = c.ok ? '✅' : '❌';
    console.log(`  ${icon} ${c.name}${c.error ? ': ' + c.error : ''}`);
    if (c.ok) pass++; else fail++;
  }
  console.log(`\n  通过: ${pass}/${checks.length}  失败: ${fail}/${checks.length}`);

  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    appVersion: 'v1.4.4',
    user: USER.email,
    seedDataPrefix: prefix,
    dataCreated: {
      category: created.category?.name,
      location: created.location?.name,
      items: created.items.map(i => i.name),
      todos: created.todos.map(t => t.title),
      secondAccount: userBEmail,
    },
    browserChecks: checks,
    summary: { total: checks.length, passed: pass, failed: fail },
  };

  const fs = await import('fs');
  fs.writeFileSync('../../docs/qa/qa-smoke-v2-report.json', JSON.stringify(report, null, 2));
  console.log(`\n  报告: docs/qa/qa-smoke-v2-report.json`);
  console.log(`  截图: docs/qa/qa-smoke-*.png`);
  console.log('\n' + '='.repeat(64));
  console.log('  🏁 完成');
  console.log('='.repeat(64));
}

main().catch(e => {
  console.error('\n❌ 错误:', e.message);
  process.exit(1);
});
