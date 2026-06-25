type AuthExpiredListener = () => void;

const listeners = new Set<AuthExpiredListener>();
let expiredNotified = false;

export const authSession = {
  onExpired(listener: AuthExpiredListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitExpired() {
    if (expiredNotified) return;
    expiredNotified = true;
    listeners.forEach((listener) => listener());
  },
  resetExpired() {
    expiredNotified = false;
  },
};
