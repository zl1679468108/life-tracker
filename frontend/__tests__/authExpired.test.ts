import { authSession } from '../lib/authSession';

describe('authSession', () => {
  it('notifies listeners when auth expires', () => {
    const listener = jest.fn();
    const unsubscribe = authSession.onExpired(listener);

    authSession.emitExpired();

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    authSession.emitExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
