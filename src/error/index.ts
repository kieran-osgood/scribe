import { ZodError } from "zod";

export function formatErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return `${JSON.stringify(error.format())}`;
  } else if (error instanceof Error) {
    return `${error.message}`;
  }

  return `${error}`;
}
