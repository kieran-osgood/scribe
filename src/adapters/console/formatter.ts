import { Process } from '@scribe/services';
import { Effect } from 'effect';

export const file = (s: string) => `file://${s}`;

export const center = (str: string) =>
  Effect.gen(function* () {
    const process = yield* Process.Process;
    const max = process.stdout.columns;

    const padStart = str.length + Math.floor((max - str.length) / 2);
    const padEnd = max - Math.floor(str.length / 2);

    return str.padStart(padStart, ' ').padEnd(padEnd, ' ');
  });

export const spacer = (s: string) => ` ${s} `;
