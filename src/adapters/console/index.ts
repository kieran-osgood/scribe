import {
  bgBlue,
  bgGreen,
  bgRed,
  bgYellow,
  black,
  blue,
  cyan,
  green,
  red,
  yellow,
} from 'colorette';
import { Console, Effect, flow, LogLevel, pipe } from 'effect';
import * as Context from 'effect/Context';

import { SYMBOLS } from '../../common/constants.js';
import { center, file, spacer } from './formatter.js';

export const ConsoleTag = Context.Tag<Console.Console, Console.Console>(
  'effect/Console',
);

export const consoleLayer = ConsoleTag.of({
  [Console.TypeId]: Console.TypeId,
  debug: (...args: string[]) =>
    Effect.sync(() => {
      console.debug(cyan(String(args.join())));
    }),
  log: (...args: string[]) =>
    Effect.sync(() => {
      console.log(String(args.join()));
    }),
  info: (...args: string[]) =>
    Effect.sync(() => {
      console.info(blue(String(args.join())));
    }),
  warn: (...args: string[]) =>
    Effect.sync(() => {
      console.warn(`${SYMBOLS.warning} ${yellow(String(args.join()))}`);
    }),
  error: (...args: string[]) =>
    Effect.sync(() => {
      console.error(`${SYMBOLS.error} ${red(String(args.join()))}`);
    }),
  unsafe: globalThis.console,
  assert: () => Effect.unit,
  clear: Effect.unit,
  count: () => Effect.unit,
  countReset: () => Effect.unit,
  dir: () => Effect.unit,
  dirxml: () => Effect.unit,
  group: () => Effect.unit,
  groupEnd: Effect.unit,
  table: () => Effect.unit,
  time: () => Effect.unit,
  timeEnd: () => Effect.unit,
  timeLog: () => Effect.unit,
  trace: () => Effect.unit,
});

// Core - styling handled via {@logger}
export const log = Console.log;
export const logDebug = Console.debug;
export const logInfo = Console.info;
export const logWarn = Console.warn;
export const logError = Console.error;

// Custom implementations
export const logSuccess = (...s: string[]) =>
  Console.log(`${SYMBOLS.success}  ${green(s.join())}`);

export const logFile = (s: string) =>
  Console.log(`${SYMBOLS.directory} ${file(s)}`);

export const logHeader = flow(center, black, bgBlue, Console.log);

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error' | 'success';
const logBgColors = {
  debug: flow(bgBlue, black),
  log: flow(bgBlue, black),
  info: flow(bgBlue, black),
  warn: flow(bgYellow, black),
  error: flow(bgRed, black),
  success: flow(bgGreen, black),
} satisfies Record<LogLevel, (s: string) => string>;

export const logGroup = (logLevel: LogLevel, g: string) => (s?: string) =>
  pipe(
    Console.log(logBgColors[logLevel](spacer(g))),
    Effect.tap(() => (s ? Console.log(s) : Effect.unit)),
  );
