export function captureBackendError(error: unknown, context: Record<string, unknown> = {}) {
  const payload = {
    source: 'backend',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('[ErrorMonitor]', payload);
}
