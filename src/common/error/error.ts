export function fmtError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error?.toString === 'function'
    // eslint-disable-next-line
    ? error?.toString()
    : 'Unknown Error';
}
