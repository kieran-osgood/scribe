import { Array as ReadonlyArray } from 'effect';
import * as Console from 'effect/Console';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';

export interface IMockConsole extends Console.Console {
  readonly getLines: (
    params?: Partial<{
      readonly stripAnsi: boolean;
    }>,
  ) => Effect.Effect<readonly string[]>;
}

export class MockConsole extends Context.Tag('effect/Console')<
  MockConsole,
  IMockConsole
>() {}

// export const MockConsole = Context.Tag<Console.Console, MockConsole>(
//   'effect/Console',
// );
const pattern = new RegExp(
  [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
  ].join('|'),
  'g',
);

const stripAnsi = (str: string) => {
  //console.log({ str });
  return String(str).replace(pattern, '');
};

export const make = Effect.gen(function* () {
  const lines = yield* Ref.make(ReadonlyArray.empty<string>());

  const getLines: IMockConsole['getLines'] = (params = {}) =>
    Ref.get(lines).pipe(
      Effect.map(lines => {
        console.log({ lines });
        return params.stripAnsi ?? false
          ? ReadonlyArray.map(lines, stripAnsi)
          : lines;
      }),
    );

  const log: IMockConsole['log'] = (...args) => {
    return Ref.update(lines, ReadonlyArray.appendAll(args));
  };

  const info: IMockConsole['info'] = (...args) => {
    return Ref.update(lines, ReadonlyArray.appendAll(args));
  };

  const warn: IMockConsole['warn'] = (...args) => {
    return Ref.update(lines, ReadonlyArray.appendAll(args));
  };

  const error: IMockConsole['error'] = (...args) => {
    return Ref.update(lines, ReadonlyArray.appendAll(args));
  };

  return MockConsole.of({
    [Console.TypeId]: Console.TypeId,
    getLines,
    log,
    info,
    warn,
    error,
    unsafe: globalThis.console,
    assert: () => Effect.void,
    clear: Effect.void,
    count: () => Effect.void,
    countReset: () => Effect.void,
    debug: () => Effect.void,
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
});

export const getLines = (
  params?: Partial<{
    readonly stripAnsi?: boolean;
  }>,
): Effect.Effect<readonly string[]> =>
  Effect.consoleWith(console => (console as IMockConsole).getLines(params));
