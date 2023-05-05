import { Effect, pipe } from '@scribe/core';
import * as NFS from 'fs';
import { ErrnoError } from './error';

export const read = (
  fd: number,
  buf: Uint8Array,
  offset: number,
  length: number,
  position: NFS.ReadPosition | null
) =>
  Effect.async<never, ErrnoError, number>(resume => {
    NFS.read(fd, buf, offset, length, position, (err, bytesRead) => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(bytesRead));
      }
    });
  });

export const write = (fd: number, data: Uint8Array, offset?: number) =>
  Effect.async<never, ErrnoError, number>(resume => {
    NFS.write(fd, data, offset, (err, written) => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(written));
      }
    });
  });

export const writeAll = (
  fd: number,
  data: Uint8Array,
  offset = 0
): Effect.Effect<never, ErrnoError, void> =>
  pipe(
    write(fd, data, offset),
    Effect.flatMap(bytesWritten => {
      const newOffset = offset + bytesWritten;

      if (newOffset >= data.byteLength) {
        return Effect.unit();
      }

      return writeAll(fd, data, newOffset);
    })
  );
