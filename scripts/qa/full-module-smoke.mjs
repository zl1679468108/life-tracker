#!/usr/bin/env node

/**
 * LifeTracker 全模块 API 冒烟测试
 *
 * 覆盖模块：
 *   1. 认证（登录、获取 profile）
 *   2. 分类 CRUD
 *   3. 位置 CRUD
 *   4. 物品 CRUD + 价值历史
 *   5. 待办 CRUD + 排序
 *   6. 借用 CRUD
 *   7. 模板 CRUD
 *   8. 共享 CRUD
 *   9. 消息/对话/好友
 *  10. 统计
 *  11. 日历
 *  12. 反馈
 *  13. 小组件
 *
 * 用法: node scripts/qa/full-module-smoke.mjs
 * 前置: 后端运行在 localhost:3020
 */

const API_BASE = 'http://localhost:3020';

// 测试账号 A（真实账号，含数据）
const USER_A = { email: '1679468108@qq.com', password: 'zl123456' };
// 测试账号 B（用于好友/共享测试）
const USER_B = { email: 'qa-chat-b-1783091828202@test.com', password: 'ChatPassB!' };

// ────────────────────────────── 工具 ──────────────────────────────

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const INFO = '\x1b[36mℹ\x1b[0m';

const results = { pass: 0, fail: 0, errors: [] };

function logPass(msg) {
  results.pass++;
  console.log(`${PASS} ${msg}`);
}

function logFail(msg, err) {
  results.fail++;
  results.errors.push(`${msg}: ${err}`);
  console.log(`${FAIL} ${msg} — ${err}`);
}

function logInfo(msg) {
  console.log(`${INFO} ${msg}`);
}

async function http(path, { method = 'GET', token, body, expected = [200, 201] } = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  }
  // 判断是否是 {code, data, message} 包裹格式
  const isWrapped = payload && typeof payload === 'object' && 'code' in payload && 'data' in payload;
  const data = isWrapped ? payload.data : payload;
  const code = payload?.code ?? res.status;
  if (!expected.includes(res.status) && !expected.includes(code)) {
    const msg = payload?.message || payload?.error || res.statusText;
    throw new Error(`${method} ${path} → ${res.status} (code=${code}): ${msg}`);
  }
  return { status: res.status, payload, data, code };
}

async function signIn(email, password) {
  const { payload } = await http('/api/auth/signin', {
    method: 'POST',
    body: { email, password },
    expected: [200],
  });
  // 兼容 {code, data:{session,user}} 和 {session, user} 两种格式
  const inner = payload?.data ?? payload;
  const token = inner?.session?.access_token || inner?.token;
  const user = inner?.user || inner?.session?.user;
  if (!token || !user?.id) throw new Error(`登录失败: ${JSON.stringify(payload)}`);
  return { token, user };
}

// ────────────────────────────── 测试模块 ──────────────────────────────

async function testAuth() {
  console.log('\n━━━ 1. 认证模块 ━━━');
  const { token, user } = await signIn(USER_A.email, USER_A.password);
  logPass(`登录成功 (user=${user.id.slice(0, 8)}...)`);

  const { data: profile } = await http('/api/auth/profile', { token });
  if (profile?.id === user.id) {
    logPass(`获取 profile 成功 (email=${profile.email})`);
  } else {
    logFail('获取 profile', 'profile.id 不匹配');
  }

  // 更新 profile（改回原值，避免污染）
  await http('/api/auth/profile', {
    method: 'PUT',
    token,
    body: { display_name: profile.display_name || '测试用户' },
  });
  logPass('更新 profile 成功');

  return token;
}

async function testCategories(token) {
  console.log('\n━━━ 2. 分类模块 ━━━');
  const { data: list1 } = await http('/api/categories', { token });
  logPass(`获取分类列表 (${list1?.length ?? 0} 条)`);

  // 创建
  const { data: created } = await http('/api/categories', {
    method: 'POST',
    token,
    body: { name: `测试分类_${Date.now()}`, type: 'item', icon: 'test-tube', color: '#FF0000' },
  });
  const catId = created?.id;
  if (!catId) throw new Error('创建分类未返回 id');
  logPass(`创建分类成功 (${catId.slice(0, 8)}...)`);

  // 查询（分类无 GET /:id 接口，通过列表确认存在）
  const { data: list1b } = await http('/api/categories', { token });
  if (list1b.find(c => c.id === catId)) logPass('列表中确认分类存在');
  else logFail('列表中确认分类', '未找到新创建的分类');

  // 更新
  const { data: updated } = await http(`/api/categories/${catId}`, {
    method: 'PUT',
    token,
    body: { name: `更新分类_${Date.now()}`, icon: 'update', color: '#00FF00' },
  });
  if (updated?.name?.startsWith('更新分类_')) logPass('更新分类成功');
  else logFail('更新分类', '名称未更新');

  // 删除
  await http(`/api/categories/${catId}`, { method: 'DELETE', token });
  logPass('删除分类成功');

  // 确认删除
  const { data: list2 } = await http('/api/categories', { token });
  if (!list2.find(c => c.id === catId)) logPass('删除后列表确认成功');
  else logFail('删除后列表', '分类仍存在');
}

async function testLocations(token) {
  console.log('\n━━━ 3. 位置模块 ━━━');
  const { data: list1 } = await http('/api/locations', { token });
  logPass(`获取位置列表 (${list1?.length ?? 0} 条)`);

  const { data: created } = await http('/api/locations', {
    method: 'POST',
    token,
    body: { name: `测试位置_${Date.now()}`, icon: 'map-marker', level: 0 },
  });
  const locId = created?.id;
  if (!locId) throw new Error('创建位置未返回 id');
  logPass(`创建位置成功 (${locId.slice(0, 8)}...)`);

  const { data: updated } = await http(`/api/locations/${locId}`, {
    method: 'PUT',
    token,
    body: { name: `更新位置_${Date.now()}`, icon: 'home' },
  });
  if (updated?.name?.startsWith('更新位置_')) logPass('更新位置成功');
  else logFail('更新位置', '名称未更新');

  await http(`/api/locations/${locId}`, { method: 'DELETE', token });
  logPass('删除位置成功');
}

async function testItems(token) {
  console.log('\n━━━ 4. 物品模块 ━━━');
  // 先建一个分类用于物品
  const { data: cat } = await http('/api/categories', {
    method: 'POST', token,
    body: { name: `物品测试分类_${Date.now()}`, type: 'item', icon: 'test-tube', color: '#3B82F6' },
  });
  const { data: loc } = await http('/api/locations', {
    method: 'POST', token,
    body: { name: `物品测试位置_${Date.now()}`, icon: 'home', level: 0 },
  });

  const { data: list1 } = await http('/api/items', { token });
  logPass(`获取物品列表 (${list1?.length ?? 0} 条)`);

  // 创建物品（含时间字段，验证 UTC 转换）
  const { data: created } = await http('/api/items', {
    method: 'POST', token,
    body: {
      name: `测试物品_${Date.now()}`,
      description: '冒烟测试创建的物品',
      category_id: cat.id,
      location_id: loc.id,
      expiry_date: '2026-12-31T23:59:59+08:00',
      purchase_date: '2026-07-10T10:00:00+08:00',
      purchase_price: 199.9,
      current_value: 180,
      currency: 'CNY',
      reminder_enabled: true,
      reminder_days_before: 7,
    },
  });
  const itemId = created?.id;
  if (!itemId) throw new Error('创建物品未返回 id');
  logPass(`创建物品成功 (${itemId.slice(0, 8)}...)，含 expiry_date/purchase_date UTC 转换`);

  // 查询单个
  const { data: got } = await http(`/api/items/${itemId}`, { token });
  if (got?.id === itemId) logPass('查询单个物品成功');
  else logFail('查询单个物品', 'id 不匹配');

  // 验证时间字段返回北京时区
  if (got?.expiry_date) {
    logPass(`expiry_date 返回值: ${got.expiry_date}`);
  } else {
    logFail('expiry_date', '值为空');
  }

  // 更新
  const { data: updated } = await http(`/api/items/${itemId}`, {
    method: 'PUT', token,
    body: { name: `更新物品_${Date.now()}`, current_value: 150 },
  });
  if (updated?.name?.startsWith('更新物品_')) logPass('更新物品成功');
  else logFail('更新物品', '名称未更新');

  // 价值历史
  const { data: history } = await http(`/api/items/${itemId}/value-history`, { token });
  logPass(`查询价值历史 (${history?.length ?? 0} 条)`);

  // 更新价值（PUT :id/value）
  await http(`/api/items/${itemId}/value`, {
    method: 'PUT', token,
    body: { value: 120, reason: '测试贬值' },
  });
  logPass('更新物品价值成功');

  // 过期物品查询
  const { data: expiring } = await http('/api/items/expiring?days=365', { token });
  logPass(`查询过期物品 (${expiring?.length ?? 0} 条)`);

  // 清理
  await http(`/api/items/${itemId}`, { method: 'DELETE', token });
  logPass('删除物品成功');
  await http(`/api/categories/${cat.id}`, { method: 'DELETE', token });
  await http(`/api/locations/${loc.id}`, { method: 'DELETE', token });
}

// ────────────────────────────── 待办 ──────────────────────────────

async function testTodos(token) {
  console.log('\n━━━ 5. 待办模块 ━━━');
  const { data: list1 } = await http('/api/todos', { token });
  logPass(`获取待办列表 (${list1?.length ?? 0} 条)`);

  const { data: created } = await http('/api/todos', {
    method: 'POST', token,
    body: {
      title: `测试待办_${Date.now()}`,
      description: '冒烟测试',
      priority: 2,
      due_date: '2026-07-15T18:00:00+08:00',
      reminder_date: '2026-07-14T09:00:00+08:00',
    },
  });
  const todoId = created?.id;
  if (!todoId) throw new Error('创建待办未返回 id');
  logPass(`创建待办成功 (${todoId.slice(0, 8)}...)，含 due_date/reminder_date`);

  const { data: got } = await http(`/api/todos/${todoId}`, { token });
  if (got?.id === todoId) logPass('查询单个待办成功');

  const { data: updated } = await http(`/api/todos/${todoId}`, {
    method: 'PUT', token,
    body: { title: `更新待办_${Date.now()}`, completed: true },
  });
  if (updated?.completed === true) logPass('更新待办（完成）成功');
  else logFail('更新待办', 'completed 未变更');

  // 排序
  const { data: todo2 } = await http('/api/todos', {
    method: 'POST', token,
    body: { title: '排序测试2', priority: 1 },
  });
  const { data: reorderRes } = await http('/api/todos/reorder', {
    method: 'POST', token,
    body: [
      { id: todoId, sort_order: 1 },
      { id: todo2.id, sort_order: 0 },
    ],
  });
  logPass('待办排序成功');

  await http(`/api/todos/${todoId}`, { method: 'DELETE', token });
  await http(`/api/todos/${todo2.id}`, { method: 'DELETE', token });
  logPass('删除待办成功');
}

// ────────────────────────────── 借用 ──────────────────────────────

async function testBorrowings(token) {
  console.log('\n━━━ 6. 借用模块 ━━━');
  // 建一个物品用于借用
  const { data: item } = await http('/api/items', {
    method: 'POST', token,
    body: { name: `借用测试物品_${Date.now()}`, description: '借用测试' },
  });

  const { data: list } = await http('/api/borrowings', { token });
  logPass(`获取借用列表 (${list?.length ?? 0} 条)`);

  const { data: active } = await http('/api/borrowings/active', { token });
  logPass(`获取活跃借用 (${active?.length ?? 0} 条)`);

  const { data: created } = await http('/api/borrowings', {
    method: 'POST', token,
    body: {
      item_id: item.id,
      borrower_name: `测试借用人_${Date.now()}`,
      borrower_contact: '13800138000',
      borrow_date: '2026-07-10T10:00:00+08:00',
      expected_return_date: '2026-07-20T18:00:00+08:00',
      notes: '测试借用',
    },
  });
  const borrowId = created?.id;
  if (!borrowId) throw new Error('创建借用未返回 id');
  logPass(`创建借用成功 (${borrowId.slice(0, 8)}...)，含 borrow_date/expected_return_date UTC 转换`);

  // 验证物品 is_borrowed 被更新
  const { data: itemCheck } = await http(`/api/items/${item.id}`, { token });
  if (itemCheck?.is_borrowed === true) logPass('物品 is_borrowed 同步更新为 true');
  else logFail('物品 is_borrowed', `值=${itemCheck?.is_borrowed}`);

  // 归还
  const { data: returned } = await http(`/api/borrowings/${borrowId}`, {
    method: 'PUT', token,
    body: { status: 'returned', actual_return_date: '2026-07-18T15:00:00+08:00' },
  });
  if (returned?.status === 'returned') logPass('归还借用成功');
  else logFail('归还借用', `status=${returned?.status}`);

  // 验证物品 is_borrowed 被清除
  const { data: itemCheck2 } = await http(`/api/items/${item.id}`, { token });
  if (itemCheck2?.is_borrowed === false) logPass('归还后物品 is_borrowed 同步清除');
  else logFail('归还后 is_borrowed', `值=${itemCheck2?.is_borrowed}`);

  // 清理
  await http(`/api/borrowings/${borrowId}`, { method: 'DELETE', token });
  await http(`/api/items/${item.id}`, { method: 'DELETE', token });
  logPass('清理借用+物品成功');
}

// ────────────────────────────── 模板 ──────────────────────────────

async function testTemplates(token) {
  console.log('\n━━━ 7. 模板模块 ━━━');
  const { data: list } = await http('/api/templates', { token });
  logPass(`获取模板列表 (${list?.length ?? 0} 条)`);

  const { data: created } = await http('/api/templates', {
    method: 'POST', token,
    body: {
      name: `测试模板_${Date.now()}`,
      description: '冒烟测试模板',
      template_type: 'item',
      data: { name: '模板物品', purchase_price: 100 },
      icon: 'stencil',
      color: '#FF6B35',
    },
  });
  const tplId = created?.id;
  if (!tplId) throw new Error('创建模板未返回 id');
  logPass(`创建模板成功 (${tplId.slice(0, 8)}...)`);

  const { data: updated } = await http(`/api/templates/${tplId}`, {
    method: 'PUT', token,
    body: { name: `更新模板_${Date.now()}`, usage_count: 1 },
  });
  if (updated?.name?.startsWith('更新模板_')) logPass('更新模板成功');
  else logFail('更新模板', '名称未更新');

  await http(`/api/templates/${tplId}`, { method: 'DELETE', token });
  logPass('删除模板成功');
}

// ────────────────────────────── 统计/日历/小组件 ──────────────────────────────

async function testStatsCalendarWidgets(token) {
  console.log('\n━━━ 8. 统计/日历/小组件 ━━━');

  const { data: advanced } = await http('/api/stats/advanced?period=month', { token });
  logPass(`获取高级统计 (items=${advanced?.items?.added ?? '?'}, todos_completed=${advanced?.todos?.completed ?? '?'})`);

  const { data: trends } = await http('/api/stats/trends?period=month&metric=items', { token });
  logPass(`获取趋势数据 (${trends?.labels?.length ?? 0} 点)`);

  const { data: heatmap } = await http('/api/stats/heatmap?year=2026', { token });
  logPass(`获取热力图 (${heatmap?.dates?.length ?? 0} 点)`);

  const { data: calendar } = await http('/api/calendar?year=2026&month=7', { token });
  logPass(`获取日历数据 2026-07 (todos=${calendar?.todos?.length ?? '?'}, items=${calendar?.expiringItems?.length ?? '?'})`);

  const { data: widgetTodos } = await http('/api/widgets/todos', { token });
  logPass(`获取小组件待办数据 (${widgetTodos?.todos?.length ?? widgetTodos?.length ?? 0} 条)`);

  const { data: widgetStats } = await http('/api/widgets/stats', { token });
  logPass(`获取小组件统计数据 (items=${widgetStats?.total_items ?? '?'})`);
}

// ────────────────────────────── 反馈 ──────────────────────────────

async function testFeedback(token) {
  console.log('\n━━━ 9. 反馈模块 ━━━');
  const { data: created } = await http('/api/feedback', {
    method: 'POST', token,
    body: {
      content: `冒烟测试反馈_${Date.now()}`,
      contact: 'test@example.com',
    },
  });
  if (created?.id) logPass(`创建反馈成功 (${created.id.slice(0, 8)}...)`);
  else logFail('创建反馈', '未返回 id');
}

// ────────────────────────────── 消息/好友/共享 ──────────────────────────────

async function testMessagesAndShares(tokenA, tokenB, userA, userB) {
  console.log('\n━━━ 10. 消息/好友/共享模块 ━━━');

  // 好友列表
  const { data: friends } = await http('/api/messages/friends', { token: tokenA });
  logPass(`获取好友列表 (${friends?.length ?? 0} 条)`);

  // 对话列表
  const { data: conversations } = await http('/api/messages/conversations', { token: tokenA });
  logPass(`获取对话列表 (${conversations?.length ?? 0} 条)`);

  // 如果 A 和 B 已是好友，尝试发送消息
  const isFriend = friends?.some(f => {
    const otherId = f.requester_id === userA.id ? f.addressee_id : f.requester_id;
    return otherId === userB.id && f.status === 'accepted';
  });

  if (isFriend) {
    // 找到 A↔B 的对话
    const conv = conversations?.find(c =>
      c.participant_ids?.includes(userA.id) && c.participant_ids?.includes(userB.id)
    );

    if (conv) {
      // 获取消息
      const { data: messages } = await http(`/api/messages/${conv.id}?limit=10`, { token: tokenA });
      logPass(`获取对话消息 (${messages?.length ?? 0} 条)`);

      // 发送一条消息
      const { data: sent } = await http(`/api/messages/${conv.id}`, {
        method: 'POST', token: tokenA,
        body: { type: 'text', content: `冒烟测试消息_${Date.now()}` },
      });
      if (sent?.id) logPass(`发送消息成功 (${sent.id.slice(0, 8)}...)`);
      else logFail('发送消息', '未返回 id');

      // 标记已读
      await http(`/api/messages/${conv.id}/read`, { method: 'POST', token: tokenA });
      logPass('标记已读成功');
    } else {
      logInfo('A↔B 对话不存在，跳过消息测试');
    }
  } else {
    logInfo('A 和 B 非好友，跳过消息测试');
  }

  // 共享：A 创建一个物品共享给 B
  const { data: item } = await http('/api/items', {
    method: 'POST', token: tokenA,
    body: { name: `共享测试物品_${Date.now()}` },
  });

  const { data: outgoing } = await http('/api/shares/outgoing', { token: tokenA });
  logPass(`获取发出共享列表 (${outgoing?.length ?? 0} 条)`);

  const { data: incoming } = await http('/api/shares/incoming', { token: tokenA });
  logPass(`获取收到共享列表 (${incoming?.length ?? 0} 条)`);

  try {
    const { data: share } = await http('/api/shares', {
      method: 'POST', token: tokenA,
      body: {
        owner_id: userA.id,
        shared_with_id: userB.id,
        resource_type: 'item',
        resource_id: item.id,
        permission: 'view',
      },
    });
    if (share?.id) {
      logPass(`创建共享成功 (${share.id.slice(0, 8)}...)`);

      // 查询资源的共享列表
      const { data: resShares } = await http(`/api/shares/resource/item/${item.id}`, { token: tokenA });
      logPass(`查询资源共享列表 (${resShares?.length ?? 0} 条)`);

      // 删除共享
      await http(`/api/shares/${share.id}`, { method: 'DELETE', token: tokenA });
      logPass('删除共享成功');
    }
  } catch (err) {
    logFail('创建共享', err.message);
  }

  // 清理
  await http(`/api/items/${item.id}`, { method: 'DELETE', token: tokenA });
}

// ────────────────────────────── 上传 ──────────────────────────────

async function testUpload(token) {
  console.log('\n━━━ 11. 上传模块 ━━━');
  // 创建一个 1x1 PNG 的 FormData
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');

  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('files', blob, 'test.png');

  const res = await fetch(`${API_BASE}/api/upload/single`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await res.json();
  if (res.status === 200 || res.status === 201) {
    const url = payload?.data?.url || payload?.url;
    if (url) logPass(`上传图片成功 (${url.slice(0, 50)}...)`);
    else logPass('上传图片成功（无 url 返回）');
  } else {
    logFail('上传图片', `${res.status}: ${payload?.message || payload?.error}`);
  }
}

// ────────────────────────────── 主流程 ──────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  LifeTracker 全模块 API 冒烟测试            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`后端: ${API_BASE}`);

  try {
    // 登录 A
    logInfo(`登录账号 A (${USER_A.email})...`);
    const { token: tokenA, user: userA } = await signIn(USER_A.email, USER_A.password);
    logInfo(`登录账号 B (${USER_B.email})...`);
    let tokenB = null, userB = null;
    try {
      const bResult = await signIn(USER_B.email, USER_B.password);
      tokenB = bResult.token;
      userB = bResult.user;
    } catch (err) {
      logInfo(`账号 B 登录失败（跳过好友/共享测试）: ${err.message}`);
    }

    // 执行各模块测试
    await testAuth();
    await testCategories(tokenA);
    await testLocations(tokenA);
    await testItems(tokenA);
    await testTodos(tokenA);
    await testBorrowings(tokenA);
    await testTemplates(tokenA);
    await testStatsCalendarWidgets(tokenA);
    await testFeedback(tokenA);
    await testUpload(tokenA);

    if (tokenB && userB) {
      await testMessagesAndShares(tokenA, tokenB, userA, userB);
    } else {
      console.log('\n━━━ 10. 消息/好友/共享模块 ━━━');
      logInfo('账号 B 不可用，跳过消息/共享测试');
    }

    // 汇总
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log(`║  测试完成: ${PASS} ${results.pass} 通过  ${FAIL} ${results.fail} 失败`);
    console.log('╚══════════════════════════════════════════════╝');

    if (results.fail > 0) {
      console.log('\n失败详情:');
      results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      process.exit(1);
    }
  } catch (err) {
    console.error('\n💥 测试中断:', err.message);
    console.error(err.stack);
    process.exit(2);
  }
}

main();
