/**
 * API 层测试
 * 测试 api.ts 中的各个 API 端点
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { api } from '../lib/api';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('api', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  jest.setTimeout(15000);

  describe('items', () => {
    it('lists items', async () => {
      const items = [{ id: '1', name: 'Test', user_id: 'u1' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: items }),
      });

      const result = await api.items.list();
      expect(result.code).toBe(200);
      expect(result.data).toEqual(items);
    });

    it('creates an item', async () => {
      const newItem = { id: '1', name: 'New Item', user_id: 'u1' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: newItem }),
      });

      const result = await api.items.create({ name: 'New Item' });
      expect(result.code).toBe(200);
      expect(result.data?.name).toBe('New Item');
    });

    it('handles 404 on get', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: '物品不存在' }),
      });

      const result = await api.items.get('nonexistent');
      expect(result.code).toBe(404);
      expect(result.data).toBeNull();
      expect(result.message).toBe('物品不存在');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));

      const result = await api.items.list();
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.data).toBeNull();
    });

    it('deletes an item', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { success: true } }),
      });

      const result = await api.items.delete('1');
      expect(result.code).toBe(200);
    });
  });

  describe('todos', () => {
    it('lists todos', async () => {
      const todos = [{ id: '1', title: 'Test Todo', user_id: 'u1' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: todos }),
      });

      const result = await api.todos.list();
      expect(result.data).toEqual(todos);
    });

    it('reorders todos', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: ['id1', 'id2'] }),
      });

      const result = await api.todos.reorder([
        { id: 'id1', sort_order: 0 },
        { id: 'id2', sort_order: 1 },
      ]);
      expect(result.data).toEqual(['id1', 'id2']);
    });
  });

  describe('auth', () => {
    it('signs in successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            token: 'test-token',
            user: { id: 'u1', email: 'test@test.com' },
          },
        }),
      });

      const result = await api.auth.signIn('test@test.com', 'password');
      expect(result.code).toBe(200);
      expect(result.data?.token).toBe('test-token');
    });

    it('handles sign in failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid login credentials' }),
      });

      const result = await api.auth.signIn('wrong@test.com', 'bad');
      expect(result.code).toBe(400);
    });
  });

  describe('categories', () => {
    it('lists categories', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'c1', name: 'Electronics', type: 'item' }] }),
      });

      const result = await api.categories.list('item');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
