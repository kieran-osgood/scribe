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
import { Console, Effect, flow, Layer, LogLevel, pipe } from 'effect';
import * as Context from 'effect/Context';

import { SYMBOLS } from '../constants.js';
import * as Formatters from './formatter.js';

export const ConsoleTag = Context.GenericTag<Console.Console, Console.Console>(
  'effect/Console',
);

export const layer = Layer.scoped(
  ConsoleTag,
  Effect.succeed(
    ConsoleTag.of({
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
    }),
  ),
);

// TODO: remove these
// Core - styling handled via {@logger}
export const log = Console.log;
export const debug = Console.debug;
export const info = Console.info;
export const warn = Console.warn;
export const error = Console.error;

// Custom implementations
export const success = (...s: string[]) =>
  Console.log(`${SYMBOLS.success}  ${green(s.join())}`);

export const file = (s: string) =>
  Console.log(`${SYMBOLS.directory} ${Formatters.file(s)}`);

export const header = flow(
  Formatters.center,
  Effect.flatMap(flow(black, bgBlue, Console.log)),
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
    Console.log(logBgColors[logLevel](Formatters.spacer(g))),
    Effect.tap(() => (s ? Console.log(s) : Effect.void)),
  );
