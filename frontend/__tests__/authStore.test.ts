import { useAuthStore } from '../stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true });
  });

  it('sets user on setUser', () => {
    useAuthStore.getState().setUser({ id: 'u1', email: 'a@example.com' });
    expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'a@example.com' });
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('clears user on setUser(null)', () => {
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
