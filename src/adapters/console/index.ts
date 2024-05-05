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
import { Console as EffectConsole, Effect, flow, LogLevel, pipe } from 'effect';
import * as Context from 'effect/Context';

import { SYMBOLS } from '../../common/constants.js';
import { center, file, spacer } from './formatter.js';

export class ConsoleTag extends Context.Tag('effect/Console')<
  ConsoleTag,
  EffectConsole.Console
>() {}

export const consoleLayer = ConsoleTag.of({
  [EffectConsole.TypeId]: EffectConsole.TypeId,
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
  assert: () => Effect.void,
  clear: Effect.void,
  count: () => Effect.void,
  countReset: () => Effect.void,
  dir: () => Effect.void,
  dirxml: () => Effect.void,
  group: () => Effect.void,
  groupEnd: Effect.void,
  table: () => Effect.void,
  time: () => Effect.void,
  timeEnd: () => Effect.void,
  timeLog: () => Effect.void,
  trace: () => Effect.void,
});

// Core - styling handled via {@logger}
export const log = EffectConsole.log;
export const logDebug = EffectConsole.debug;
export const logInfo = EffectConsole.info;
export const logWarn = EffectConsole.warn;
export const logError = EffectConsole.error;

// Custom implementations
export const logSuccess = (...s: string[]) =>
  EffectConsole.log(`${SYMBOLS.success}  ${green(s.join())}`);

export const logFile = (s: string) =>
  EffectConsole.log(`${SYMBOLS.directory} ${file(s)}`);

export const logHeader = flow(
  center,
  Effect.map(flow(black, bgBlue, EffectConsole.log)),
);

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
    EffectConsole.log(logBgColors[logLevel](spacer(g))),
    Effect.tap(() => (s ? EffectConsole.log(s) : Effect.void)),
  );
