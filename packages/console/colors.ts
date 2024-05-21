import {
  bgBlue,
  bgGreen,
  bgRed,
  bgYellow,
  black,
  blue,
  Color,
  cyan,
  green,
  red,
  white,
  yellow,
} from 'colorette';
import { Effect, flow } from 'effect';

type LogColors = Record<LogLevel, Color>;
export type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error' | 'success';

export type PrintFn = (...args: readonly unknown[]) => Effect.Effect<void>;

export const printLogLevel =
  (print: PrintFn, stylerMap: LogColors) =>
  (logLevel: LogLevel) =>
  (...args: readonly unknown[]) =>
    print(stylerMap[logLevel](String(args.join())));

export const logGroupColors: LogColors = {
  debug: flow(bgBlue, black),
  log: flow(bgBlue, black),
  info: flow(bgBlue, black),
  warn: flow(bgYellow, black),
  error: flow(bgRed, black),
  success: flow(bgGreen, black),
};

export const logColors: LogColors = {
  debug: cyan,
  log: white,
  info: blue,
  warn: yellow,
  error: red,
  success: green,
};
