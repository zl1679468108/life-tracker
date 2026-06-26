/**
 * Auth 流程集成测试
 * 测试 signIn / signUp / init / OAuth 完整流程
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../lib/api', () => ({
  api: {
    auth: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      getProfile: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  },
  resetAuthExpiredState: jest.fn(),
}));

jest.mock('../lib/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('../lib/token', () => {
  let stored: string | null = null;
  return {
    getAuthToken: jest.fn(() => Promise.resolve(stored)),
    setAuthToken: jest.fn((t: string | null) => {
      stored = t;
      return Promise.resolve();
    }),
  };
});

jest.mock('../stores/profileStore', () => ({
  useProfileStore: {
    getState: jest.fn(() => ({
      clearCache: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

jest.mock('../lib/authSession', () => ({
  authSession: {
    resetExpired: jest.fn(),
  },
}));

import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

describe('authFlow', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true });
    jest.clearAllMocks();
  });

  it('signs in with valid credentials', async () => {
    (api.auth.signIn as jest.Mock).mockResolvedValue({
      code: 200,
      data: { token: 'token-123', user: { id: 'u1', email: 'test@test.com' } },
    });

    await useAuthStore.getState().signIn('test@test.com', 'password');
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: 'u1', email: 'test@test.com' });
    expect(state.loading).toBe(false);
  });

  it('throws on invalid credentials', async () => {
    (api.auth.signIn as jest.Mock).mockResolvedValue({
      code: 400,
      data: {},
      message: 'Invalid login credentials',
    });

    await expect(
      useAuthStore.getState().signIn('bad@test.com', 'wrong')
    ).rejects.toThrow('Invalid login credentials');

    // User should stay null
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('signs up successfully', async () => {
    (api.auth.signUp as jest.Mock).mockResolvedValue({
      code: 200,
      data: { token: 'token-456', user: { id: 'u2', email: 'new@test.com' } },
    });

    await useAuthStore.getState().signUp('new@test.com', 'password123');
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: 'u2', email: 'new@test.com' });
  });

  it('throws on signup failure', async () => {
    (api.auth.signUp as jest.Mock).mockResolvedValue({
      code: 400,
      data: {},
      message: 'Email already registered',
    });

    await expect(
      useAuthStore.getState().signUp('existing@test.com', 'password')
    ).rejects.toThrow('Email already registered');
  });

  it('initializes with stored token', async () => {
    // Use the mocked token module
    const tokenModule = require('../lib/token');
    await tokenModule.setAuthToken('stored-token');

    (api.auth.getProfile as jest.Mock).mockResolvedValue({
      code: 200,
      data: { id: 'u1', email: 'test@test.com', display_name: 'Test User' },
    });

    await useAuthStore.getState().init();
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: 'u1', email: 'test@test.com' });
  });

  it('clears invalid token on init', async () => {
    const tokenModule = require('../lib/token');
    await tokenModule.setAuthToken('expired-token');

    (api.auth.getProfile as jest.Mock).mockRejectedValue(new Error('Token expired'));

    await useAuthStore.getState().init();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('handles OAuth callback', async () => {
    (api.auth.getProfile as jest.Mock).mockResolvedValue({
      code: 200,
      data: { id: 'u1', email: 'oauth@test.com' },
    });

    await useAuthStore.getState().handleOAuthCallback('oauth-token', 'refresh-token');
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: 'u1', email: 'oauth@test.com' });
  });

  it('signs out and clears state', async () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'test@test.com' }, loading: false });

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
  });
});
