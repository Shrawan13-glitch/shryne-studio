type Level = 'debug' | 'info' | 'warn' | 'error';

function log(level: Level, scope: string, message: string, meta?: unknown): void {
  if (__DEV__ && level === 'debug') {
    console.debug(`[${scope}] ${message}`, meta ?? '');
    return;
  }
  if (level === 'error') console.error(`[${scope}] ${message}`, meta ?? '');
  if (level === 'warn') console.warn(`[${scope}] ${message}`, meta ?? '');
}

export const logger = {
  debug: (scope: string, message: string, meta?: unknown) => log('debug', scope, message, meta),
  info: (scope: string, message: string, meta?: unknown) => log('info', scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) => log('warn', scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) => log('error', scope, message, meta),
};
