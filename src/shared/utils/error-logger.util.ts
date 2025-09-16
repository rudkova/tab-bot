import logger from '../logger/logger.ts';

export function logError(
  message: string,
  error: unknown,
  additionalData?: Record<string, unknown>
): void {
  if (error instanceof Error) {
    logger.error(message, {
      ...additionalData,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.error(message, {
      ...additionalData,
      error: String(error),
    });
  }
}
