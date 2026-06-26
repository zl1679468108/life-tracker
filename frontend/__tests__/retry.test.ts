/**
 * 网络重试机制测试
 */

// Mock network monitor to always return online
jest.mock('../lib/network', () => ({
  networkMonitor: {
    isOnline: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
  },
}));

import { withRetry } from '../lib/retry';

describe('withRetry', () => {
  it('succeeds on first try', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 'GET', { baseDelay: 1, networkRestoreDelay: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on network error and succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ code: 'NETWORK_ERROR' })
      .mockResolvedValueOnce('ok');

    const result = await withRetry(fn, 'GET', { baseDelay: 1, networkRestoreDelay: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('fails after all retries exhausted', async () => {
    const fn = jest.fn().mockRejectedValue({ code: 'NETWORK_ERROR' });

    await expect(
      withRetry(fn, 'GET', { maxRetries: 2, baseDelay: 1, networkRestoreDelay: 1 })
    ).rejects.toEqual({ code: 'NETWORK_ERROR' });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx errors', async () => {
    const fn = jest.fn().mockRejectedValue({ code: 404 });

    await expect(
      withRetry(fn, 'GET', { baseDelay: 1, networkRestoreDelay: 1 })
    ).rejects.toEqual({ code: 404 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx errors', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ code: 500 })
      .mockResolvedValueOnce('ok');

    const result = await withRetry(fn, 'GET', { baseDelay: 1, networkRestoreDelay: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('limits retries to 1 for non-GET methods', async () => {
    const fn = jest.fn().mockRejectedValue({ code: 500 });

    await expect(
      withRetry(fn, 'POST', { baseDelay: 1, networkRestoreDelay: 1 })
    ).rejects.toMatchObject({});
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('handles AbortError (timeout)', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce({ name: 'AbortError' })
      .mockResolvedValueOnce('ok');

    const result = await withRetry(fn, 'GET', { baseDelay: 1, networkRestoreDelay: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
