type ErrorContext = Record<string, unknown>;

export function captureFrontendError(error: unknown, context: ErrorContext = {}) {
  const payload = {
    source: 'frontend',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('[ErrorMonitor]', payload);
}
