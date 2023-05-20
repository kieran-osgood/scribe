import { ZodError } from 'zod';

export function fmtError(error: unknown) {
  if (error instanceof ZodError) {
    return JSON.stringify(error.format());
  }

  if (error instanceof Error) {
    return error.message;
  }

  return typeof error?.toString === 'function'
    ? error?.toString()
    : 'Unknown Error';
}
