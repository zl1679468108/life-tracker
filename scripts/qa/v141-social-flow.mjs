#!/usr/bin/env node

const config = {
  apiBase: process.env.API_BASE || 'http://localhost:3020',
  emailA: process.env.QA_USER_A_EMAIL,
  passwordA: process.env.QA_USER_A_PASSWORD,
  emailB: process.env.QA_USER_B_EMAIL,
  passwordB: process.env.QA_USER_B_PASSWORD,
  keepData: process.env.QA_KEEP_DATA === '1',
};

const state = {
  createdItemId: null,
  createdTodoId: null,
  shareId: null,
  friendshipId: null,
};

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}. See docs/QA_V1_4_1.md for setup.`);
  }
}

function assert(condition, message, detail) {
  if (!condition) {
    const suffix = detail ? `\n${JSON.stringify(detail, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

function getPayloadData(payload) {
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

async function http(path, { method = 'GET', token, body, expected = [200, 201] } = {}) {
  const response = await fetch(`${config.apiBase}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }
  const ok = expected.includes(response.status);
  if (!ok) {
    const message = payload?.message || payload?.error || response.statusText;
    throw new Error(`${method} ${path} failed with ${response.status}: ${message}\n${JSON.stringify(payload, null, 2)}`);
  }
  return { response, payload, data: getPayloadData(payload) };
}

async function step(name, fn) {
  process.stdout.write(`- ${name} ... `);
  const result = await fn();
  console.log('PASS');
  return result;
}

async function signIn(email, password) {
  const { data } = await http('/api/auth/signin', {
    method: 'POST',
    body: { email, password },
  });
  const token = data?.session?.access_token || data?.token;
  const user = data?.user || data?.session?.user;
  assert(token, `Signin did not return token for ${email}`, data);
  assert(user?.id, `Signin did not return user id for ${email}`, data);
  return { token, user };
}

async function findUserByEmail(token, email) {
  const query = encodeURIComponent(email);
  const { data } = await http(`/api/messages/users/search?q=${query}`, { token });
  const users = Array.isArray(data) ? data : [];
  const user = users.find((candidate) => candidate.email === email) || users[0];
  assert(user?.id, `Could not find target user ${email}`, data);
  return user;
}

async function listFriends(token) {
  const { data } = await http('/api/messages/friends', { token });
  return Array.isArray(data) ? data : [];
}

async function listFriendRequests(token) {
  const { data } = await http('/api/messages/friends/requests', { token });
  return Array.isArray(data) ? data : [];
}

async function cleanupExistingFriendship(tokenA, tokenB, userAId, userBId) {
  const pendingA = await listFriendRequests(tokenA);
  const incomingToA = pendingA.find((friendship) => friendship.direction === 'incoming' && friendship.friend?.id === userBId);
  if (incomingToA?.id) {
    const { data } = await http(`/api/messages/friends/requests/${incomingToA.id}`, {
      method: 'PATCH',
      token: tokenA,
      body: { action: 'accept' },
      expected: [200, 404],
    });
    if (data?.id) {
      await http(`/api/messages/friends/${data.id}/delete`, {
        method: 'PATCH',
        token: tokenA,
        expected: [200, 404],
      });
    }
  }

  const pendingB = await listFriendRequests(tokenB);
  const incomingToB = pendingB.find((friendship) => friendship.direction === 'incoming' && friendship.friend?.id === userAId);
  if (incomingToB?.id) {
    const { data } = await http(`/api/messages/friends/requests/${incomingToB.id}`, {
      method: 'PATCH',
      token: tokenB,
      body: { action: 'accept' },
      expected: [200, 404],
    });
    if (data?.id) {
      await http(`/api/messages/friends/${data.id}/delete`, {
        method: 'PATCH',
        token: tokenB,
        expected: [200, 404],
      });
    }
  }

  for (const token of [tokenA, tokenB]) {
    const friends = await listFriends(token);
    const existing = friends.find((friendship) => {
      const otherId = friendship.friend?.id;
      return otherId === userAId || otherId === userBId;
    });
    if (existing?.id) {
      await http(`/api/messages/friends/${existing.id}/delete`, {
        method: 'PATCH',
        token,
        expected: [200, 404],
      });
      return;
    }
  }
}

async function createItem(token) {
  const marker = new Date().toISOString();
  const { data } = await http('/api/items', {
    method: 'POST',
    token,
    body: {
      name: `QA 自动化物品 ${marker}`,
      description: 'v1.4.1 social flow smoke test',
      images: [],
      reminder_enabled: false,
      current_value: 1,
      currency: 'CNY',
    },
  });
  assert(data?.id, 'Item creation did not return id', data);
  state.createdItemId = data.id;
  return data;
}

async function createTodo(token) {
  const marker = new Date().toISOString();
  const { data } = await http('/api/todos', {
    method: 'POST',
    token,
    body: {
      title: `QA 自动化待办 ${marker}`,
      description: 'v1.4.1 social flow smoke test',
      priority: 1,
      completed: false,
      images: [],
    },
  });
  assert(data?.id, 'Todo creation did not return id', data);
  state.createdTodoId = data.id;
  return data;
}

async function sendFriendRequest(token, targetUserId) {
  const { data } = await http('/api/messages/friends/requests', {
    method: 'POST',
    token,
    body: {
      target_user_id: targetUserId,
      message: '你好，我想添加你为好友',
    },
    expected: [200, 201],
  });
  assert(data?.id, 'Friend request did not return id', data);
  state.friendshipId = data.id;
  return data;
}

async function acceptFriendRequest(tokenB, friendshipId) {
  const { data } = await http(`/api/messages/friends/requests/${friendshipId}`, {
    method: 'PATCH',
    token: tokenB,
    body: { action: 'accept' },
  });
  assert(data?.status === 'accepted', 'Friend request was not accepted', data);
  return data;
}

async function setFriendPinned(token, friendshipId, pinned) {
  const { data } = await http(`/api/messages/friends/${friendshipId}/pin`, {
    method: 'PATCH',
    token,
    body: { pinned },
  });
  assert(data?.pinned === pinned, `Friend pinned state should be ${pinned}`, data);
  return data;
}

async function createShare(token, resourceType, resourceId, sharedWithId) {
  const { data } = await http('/api/shares', {
    method: 'POST',
    token,
    body: {
      resource_type: resourceType,
      resource_id: resourceId,
      shared_with_id: sharedWithId,
      permission: 'view',
    },
  });
  assert(data?.id, 'Share creation did not return id', data);
  assert(data?.conversation_id, 'Share creation did not return conversation_id', data);
  state.shareId = data.id;
  return data;
}

async function findConversation(token, conversationId, participantId) {
  const { data } = await http('/api/messages/conversations', { token });
  const conversations = Array.isArray(data) ? data : [];
  const conversation = conversationId
    ? conversations.find((item) => item.id === conversationId)
    : conversations.find((item) => Array.isArray(item.participant_ids) && item.participant_ids.includes(participantId));
  assert(conversation?.id, 'Conversation was not visible in conversation list', data);
  return conversation;
}

async function listMessages(token, conversationId) {
  const { data } = await http(`/api/messages/conversations/${conversationId}`, { token });
  const messages = Array.isArray(data) ? data : [];
  assert(messages.length > 0, 'Conversation should contain at least one message', data);
  return messages;
}

async function sendMessage(token, conversationId) {
  const { data } = await http(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    token,
    body: {
      type: 'text',
      content: '接口自动化验收消息',
    },
  });
  assert(data?.id, 'Text message creation did not return id', data);
  return data;
}

async function markAsRead(token, conversationId) {
  const { data } = await http(`/api/messages/conversations/${conversationId}/read`, {
    method: 'PATCH',
    token,
  });
  assert(data?.success === true, 'Mark as read did not return success', data);
  return data;
}

async function cleanup(tokenA) {
  if (config.keepData) return;

  const operations = [];
  if (state.shareId) {
    operations.push(http(`/api/shares/${state.shareId}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  }
  if (state.friendshipId) {
    operations.push(http(`/api/messages/friends/${state.friendshipId}/delete`, { method: 'PATCH', token: tokenA, expected: [200, 404] }));
  }
  if (state.createdItemId) {
    operations.push(http(`/api/items/${state.createdItemId}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  }
  if (state.createdTodoId) {
    operations.push(http(`/api/todos/${state.createdTodoId}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  }

  const results = await Promise.allSettled(operations);
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Cleanup completed with ${failures.length} warning(s).`);
    failures.forEach((failure) => console.warn(failure.reason?.message || failure.reason));
  }
}

async function main() {
  let userA;
  let userB;
  try {
    requireEnv('QA_USER_A_EMAIL', config.emailA);
    requireEnv('QA_USER_A_PASSWORD', config.passwordA);
    requireEnv('QA_USER_B_EMAIL', config.emailB);
    requireEnv('QA_USER_B_PASSWORD', config.passwordB);

    console.log('LifeTracker v1.4.1 social flow smoke test');
    console.log(`API: ${config.apiBase}`);

    userA = await step('用户 A 登录', () => signIn(config.emailA, config.passwordA));
    userB = await step('用户 B 登录', () => signIn(config.emailB, config.passwordB));

    await step('清理 A/B 已有好友关系', () =>
      cleanupExistingFriendship(userA.token, userB.token, userA.user.id, userB.user.id)
    );

    const targetUser = await step('A 搜索 B', () => findUserByEmail(userA.token, config.emailB));
    assert(targetUser.id === userB.user.id, 'Search result user id does not match user B', targetUser);

    const item = await step('A 创建测试物品', () => createItem(userA.token));
    await step('A 创建测试待办', () => createTodo(userA.token));

    const request = await step('A 发送好友申请', () => sendFriendRequest(userA.token, userB.user.id));
    const bRequests = await step('B 查看好友申请', () => listFriendRequests(userB.token));
    assert(bRequests.some((entry) => entry.id === request.id && entry.direction === 'incoming'), 'B did not see incoming friend request', bRequests);

    const accepted = await step('B 接受好友申请', () => acceptFriendRequest(userB.token, request.id));
    const aFriends = await step('A 查看好友列表', () => listFriends(userA.token));
    assert(aFriends.some((entry) => entry.id === accepted.id && entry.friend?.id === userB.user.id), 'A did not see B in friend list', aFriends);

    await step('A 置顶好友', () => setFriendPinned(userA.token, accepted.id, true));
    await step('A 取消置顶好友', () => setFriendPinned(userA.token, accepted.id, false));

    const share = await step('A 共享测试物品给 B', () => createShare(userA.token, 'item', item.id, userB.user.id));
    const conversationA = await step('A 查看共享对话', () => findConversation(userA.token, share.conversation_id, userB.user.id));
    await step('B 查看共享对话', () => findConversation(userB.token, share.conversation_id, userA.user.id));

    const messages = await step('A 查看对话消息', () => listMessages(userA.token, conversationA.id));
    assert(messages.some((message) => message.type === 'item' && message.resource_id === item.id), 'Conversation did not contain shared item card', messages);

    await step('A 发送文字消息', () => sendMessage(userA.token, conversationA.id));
    await step('B 标记对话已读', () => markAsRead(userB.token, conversationA.id));

    await step('清理测试数据', () => cleanup(userA.token));
    console.log('\nAll v1.4.1 social flow checks passed.');
  } catch (error) {
    console.error('\nFAILED');
    console.error(error?.message || error);
    if (userA?.token) {
      await cleanup(userA.token).catch((cleanupError) => {
        console.warn(`Cleanup after failure failed: ${cleanupError?.message || cleanupError}`);
      });
    }
    process.exitCode = 1;
  }
}

main();
