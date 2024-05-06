/* eslint-disable @typescript-eslint/unbound-method */
import { effectify } from '@effect/platform/Effectify';
import * as Error from '@effect/platform/Error';
import { Effect, Layer, pipe } from 'effect';
import * as memfs from 'memfs';

import { handleErrnoException } from './error.js';
import * as FS from './fs.js';

const handleBadArgument = (method: string) => (err: unknown) =>
  Error.BadArgument({
    module: 'FileSystem',
    method,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    message: (err as Error).message ?? String(err),
  });

const access = (() => {
  const nodeAccess = effectify(
    memfs.fs.access,
    handleErrnoException('FileSystem', 'access'),
    handleBadArgument('access'),
  );
  return (path: string, options?: FileSystem.AccessFileOptions) => {
    let mode = memfs.fs.constants.F_OK;
    if (options?.readable) {
      mode |= memfs.fs.constants.R_OK;
    }
    if (options?.writable) {
      mode |= memfs.fs.constants.W_OK;
    }
    return nodeAccess(path, mode);
  };
})();

// == copy

const copy = (() => {
  const nodeCp = effectify(
    memfs.fs.cp,
    handleErrnoException('FileSystem', 'copy'),
    handleBadArgument('copy'),
  );
  return (fromPath: string, toPath: string, options?: FileSystem.CopyOptions) =>
    // @ts-expect-error Not Needed
    nodeCp(fromPath, toPath, {
      force: options?.overwrite ?? false,
      preserveTimestamps: options?.preserveTimestamps ?? false,
      recursive: true,
    });
})();

// == copyFile

const copyFile = (() => {
  const nodeCopyFile = effectify(
    memfs.fs.copyFile,
    handleErrnoException('FileSystem', 'copyFile'),
    handleBadArgument('copyFile'),
  );
  return (fromPath: string, toPath: string) => nodeCopyFile(fromPath, toPath);
})();

// == chmod

const chmod = (() => {
  const nodeChmod = effectify(
    memfs.fs.chmod,
    handleErrnoException('FileSystem', 'chmod'),
    handleBadArgument('chmod'),
  );
  return (path: string, mode: number) => nodeChmod(path, mode);
})();

// == chown

const chown = (() => {
  const nodeChown = effectify(
    memfs.fs.chown,
    handleErrnoException('FileSystem', 'chown'),
    handleBadArgument('chown'),
  );
  return (path: string, uid: number, gid: number) => nodeChown(path, uid, gid);
})();

// == link

const link = (() => {
  const nodeLink = effectify(
    memfs.fs.link,
    handleErrnoException('FileSystem', 'link'),
    handleBadArgument('link'),
  );
  return (existingPath: string, newPath: string) =>
    nodeLink(existingPath, newPath);
})();

// == makeDirectory

const makeDirectory = (() => {
  const nodeMkdir = effectify(
    memfs.fs.mkdir,
    handleErrnoException('FileSystem', 'makeDirectory'),
    handleBadArgument('makeDirectory'),
  );
  return (path: string, options?: FileSystem.MakeDirectoryOptions) =>
    // @ts-expect-error Not Needed
    nodeMkdir(path, {
      recursive: options?.recursive ?? false,
      mode: options?.mode,
    });
})();

// == makeTempDirectory

const makeTempDirectoryFactory = (method: string) => {
  const nodeMkdtemp = effectify(
    memfs.fs.mkdtemp,
    handleErrnoException('FileSystem', method),
    handleBadArgument(method),
  );
  return (options?: FileSystem.MakeTempDirectoryOptions) =>
    Effect.suspend(() => {
      const prefix = options?.prefix ?? '';
      const directory =
        typeof options?.directory === 'string'
          ? // @ts-expect-error Not Needed
            Path.join(options.directory, '.')
          : // @ts-expect-error Not Needed
            OS.tmpdir();

      return nodeMkdtemp(
        // @ts-expect-error Not Needed
        prefix ? Path.join(directory, prefix) : directory + '/',
      );
    });
};
const makeTempDirectory = makeTempDirectoryFactory('makeTempDirectory');

// == remove

const removeFactory = (method: string) => {
  const nodeRm = effectify(
    memfs.fs.rm,
    handleErrnoException('FileSystem', method),
    handleBadArgument(method),
  );
  return (path: string, options?: FileSystem.RemoveOptions) =>
    nodeRm(path, {
      recursive: options?.recursive ?? false,
      force: options?.force ?? false,
    });
};
const remove = removeFactory('remove');

// == makeTempDirectoryScoped

const makeTempDirectoryScoped = (() => {
  const makeDirectory = makeTempDirectoryFactory('makeTempDirectoryScoped');
  const removeDirectory = removeFactory('makeTempDirectoryScoped');
  return (options?: FileSystem.MakeTempDirectoryOptions) =>
    Effect.acquireRelease(makeDirectory(options), directory =>
      Effect.orDie(removeDirectory(directory, { recursive: true })),
    );
})();

// == open

const openFactory = (method: string) => {
  const nodeOpen = effectify(
    memfs.fs.open,
    handleErrnoException('FileSystem', method),
    handleBadArgument(method),
  );
  const nodeClose = effectify(
    memfs.fs.close,
    handleErrnoException('FileSystem', method),
    handleBadArgument(method),
  );

  return (path: string, options?: FileSystem.OpenFileOptions) =>
    pipe(
      Effect.acquireRelease(
        // @ts-expect-error Not Needed
        nodeOpen(path, options?.flag ?? 'r', options?.mode),
        fd => Effect.orDie(nodeClose(fd)),
      ),
      Effect.map(fd =>
        makeFile(
          FileSystem.FileDescriptor(fd),
          options?.flag?.startsWith('a') ?? false,
        ),
      ),
    );
};
const open = openFactory('open');

const makeFile = (() => {
  const nodeReadFactory = (method: string) =>
    effectify(
      memfs.fs.read,
      handleErrnoException('FileSystem', method),
      handleBadArgument(method),
    );
  const nodeRead = nodeReadFactory('read');
  const nodeReadAlloc = nodeReadFactory('readAlloc');
  const nodeStat = effectify(
    memfs.fs.fstat,
    handleErrnoException('FileSystem', 'stat'),
    handleBadArgument('stat'),
  );
  const nodeTruncate = effectify(
    memfs.fs.ftruncate,
    handleErrnoException('FileSystem', 'truncate'),
    handleBadArgument('truncate'),
  );

  const nodeWriteFactory = (method: string) =>
    effectify(
      memfs.fs.write,
      handleErrnoException('FileSystem', method),
      handleBadArgument(method),
    );
  const nodeWrite = nodeWriteFactory('write');
  const nodeWriteAll = nodeWriteFactory('writeAll');

  class FileImpl implements FileSystem.File {
    readonly [FileSystem.FileTypeId]: FileSystem.FileTypeId;

    private readonly semaphore = Effect.unsafeMakeSemaphore(1);
    private position = 0n;

    constructor(
      readonly fd: FileSystem.File.Descriptor,
      private readonly append: boolean,
    ) {
      this[FileSystem.FileTypeId] = FileSystem.FileTypeId;
    }

    get stat() {
      // @ts-expect-error Not Needed
      return Effect.map(nodeStat(this.fd), makeFileInfo);
    }

    seek(offset: FileSystem.SizeInput, from: FileSystem.SeekMode) {
      const offsetSize = FileSystem.Size(offset);
      return this.semaphore.withPermits(1)(
        Effect.sync(() => {
          if (from === 'start') {
            this.position = offsetSize;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (from === 'current') {
            this.position = this.position + offsetSize;
          }

          return this.position;
        }),
      );
    }

    read(buffer: Uint8Array) {
      return this.semaphore.withPermits(1)(
        Effect.map(
          Effect.suspend(() =>
            // @ts-expect-error Not Needed
            nodeRead(this.fd, {
              buffer,
              position: this.position,
            }),
          ),
          bytesRead => {
            const sizeRead = FileSystem.Size(bytesRead);
            this.position = this.position + sizeRead;
            return sizeRead;
          },
        ),
      );
    }

    readAlloc(size: FileSystem.SizeInput) {
      const sizeNumber = Number(size);
      return this.semaphore.withPermits(1)(
        Effect.flatMap(
          Effect.sync(() => Buffer.allocUnsafeSlow(sizeNumber)),
          buffer =>
            Effect.map(
              // @ts-expect-error Not Needed
              nodeReadAlloc(this.fd, {
                buffer,
                position: this.position,
              }),
              // @ts-expect-error Not Needed
              (bytesRead): Option.Option<Buffer> => {
                if (bytesRead === 0) {
                  // @ts-expect-error Not Needed
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  return Option.none();
                }

                this.position = this.position + BigInt(bytesRead);
                if (bytesRead === sizeNumber) {
                  // @ts-expect-error Not Needed
                  return Option.some(buffer);
                }

                const dst = Buffer.allocUnsafeSlow(bytesRead);
                buffer.copy(dst, 0, 0, bytesRead);
                return Option.some(dst);
              },
            ),
        ),
      );
    }

    truncate(length?: FileSystem.SizeInput) {
      return this.semaphore.withPermits(1)(
        Effect.map(
          // @ts-expect-error Not Needed
          nodeTruncate(this.fd, length ? Number(length) : undefined),
          () => {
            if (!this.append) {
              const len = BigInt(length ?? 0);
              if (this.position > len) {
                this.position = len;
              }
            }
          },
        ),
      );
    }

    write(buffer: Uint8Array) {
      return this.semaphore.withPermits(1)(
        Effect.map(
          Effect.suspend(() =>
            nodeWrite(
              this.fd,
              buffer,
              // @ts-expect-error Not Needed
              undefined,
              undefined,
              this.append ? undefined : Number(this.position),
            ),
          ),
          bytesWritten => {
            // @ts-expect-error Not Needed
            const sizeWritten = FileSystem.Size(bytesWritten);
            if (!this.append) {
              this.position = this.position + sizeWritten;
            }

            return sizeWritten;
          },
        ),
      );
    }

    private writeAllChunk(
      buffer: Uint8Array,
    ): Effect.Effect<void, Error.PlatformError> {
      return Effect.flatMap(
        Effect.suspend(() =>
          nodeWriteAll(
            this.fd,
            buffer,
            // @ts-expect-error Not Needed
            undefined,
            undefined,
            this.append ? undefined : Number(this.position),
          ),
        ),
        bytesWritten => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (bytesWritten === 0) {
            return Effect.fail(
              Error.SystemError({
                module: 'FileSystem',
                method: 'writeAll',
                reason: 'WriteZero',
                pathOrDescriptor: this.fd,
                message: 'write returned 0 bytes written',
              }),
            );
          }

          if (!this.append) {
            // @ts-expect-error Not Needed
            this.position = this.position + BigInt(bytesWritten);
          }

          // @ts-expect-error Not Needed
          return bytesWritten < buffer.length
            ? // @ts-expect-error Not Needed
              this.writeAllChunk(buffer.subarray(bytesWritten))
            : Effect.void;
        },
      );
    }

    writeAll(buffer: Uint8Array) {
      return this.semaphore.withPermits(1)(this.writeAllChunk(buffer));
    }
  }

  return (fd: FileSystem.File.Descriptor, append: boolean): FileSystem.File =>
    new FileImpl(fd, append);
})();

// == makeTempFile

const makeTempFileFactory = (method: string) => {
  const makeDirectory = makeTempDirectoryFactory(method);
  const open = openFactory(method);
  const randomHexString = (bytes: number) =>
    // @ts-expect-error Not Needed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    Effect.sync(() => Crypto.randomBytes(bytes).toString('hex'));
  return (options?: FileSystem.MakeTempFileOptions) =>
    pipe(
      Effect.zip(makeDirectory(options), randomHexString(6)),
      Effect.map(([directory, random]) => Path.join(directory, random)),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Effect.tap(path => Effect.scoped(open(path, { flag: 'w+' }))),
    );
};
const makeTempFile = makeTempFileFactory('makeTempFile');

// == makeTempFileScoped

const makeTempFileScoped = (() => {
  const makeFile = makeTempFileFactory('makeTempFileScoped');
  const removeFile = removeFactory('makeTempFileScoped');
  return (options?: FileSystem.MakeTempFileOptions) =>
    Effect.acquireRelease(makeFile(options), file =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Effect.orDie(removeFile(file)),
    );
})();

// == readDirectory

const readDirectory = (
  path: string,
  options?: FileSystem.ReadDirectoryOptions,
) =>
  Effect.tryPromise({
    // @ts-expect-error Not Needed
    try: async () => memfs.fs.promises.readdir(path, options),
    catch: err =>
      // @ts-expect-error Not Needed
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      handleErrnoException('FileSystem', 'readDirectory')(err, [path]),
  });

// == readFile

const readFile = (path: string) =>
  Effect.async<Uint8Array, Error.PlatformError>((resume, signal) => {
    try {
      memfs.fs.readFile(path, { signal }, (err, data) => {
        if (err) {
          resume(
            Effect.fail(
              handleErrnoException('FileSystem', 'readFile')(err, [path]),
            ),
          );
        } else {
          resume(Effect.succeed(data));
        }
      });
    } catch (err) {
      resume(Effect.fail(handleBadArgument('readFile')(err)));
    }
  });

// == readLink

const readLink = (() => {
  const nodeReadLink = effectify(
    memfs.fs.readlink,
    handleErrnoException('FileSystem', 'readLink'),
    handleBadArgument('readLink'),
  );
  return (path: string) => nodeReadLink(path);
})();

// == realPath

const realPath = (() => {
  const nodeRealPath = effectify(
    memfs.fs.realpath,
    handleErrnoException('FileSystem', 'realPath'),
    handleBadArgument('realPath'),
  );
  return (path: string) => nodeRealPath(path);
})();

// == rename

const rename = (() => {
  const nodeRename = effectify(
    memfs.fs.rename,
    handleErrnoException('FileSystem', 'rename'),
    handleBadArgument('rename'),
  );
  return (oldPath: string, newPath: string) => nodeRename(oldPath, newPath);
})();

// == stat

const makeFileInfo = (stat: typeof memfs.fs.Stats): FileSystem.File.Info => ({
  type: stat.isFile()
    ? 'File'
    : stat.isDirectory()
      ? 'Directory'
      : stat.isSymbolicLink()
        ? 'SymbolicLink'
        : stat.isBlockDevice()
          ? 'BlockDevice'
          : stat.isCharacterDevice()
            ? 'CharacterDevice'
            : stat.isFIFO()
              ? 'FIFO'
              : stat.isSocket()
                ? 'Socket'
                : 'Unknown',
  mtime: Option.fromNullable(stat.mtime),
  atime: Option.fromNullable(stat.atime),
  birthtime: Option.fromNullable(stat.birthtime),
  dev: stat.dev,
  rdev: Option.fromNullable(stat.rdev),
  ino: Option.fromNullable(stat.ino),
  mode: stat.mode,
  nlink: Option.fromNullable(stat.nlink),
  uid: Option.fromNullable(stat.uid),
  gid: Option.fromNullable(stat.gid),
  size: FileSystem.Size(stat.size),
  blksize: Option.fromNullable(FileSystem.Size(stat.blksize)),
  blocks: Option.fromNullable(stat.blocks),
});
const stat = (() => {
  const nodeStat = effectify(
    memfs.fs.stat,
    handleErrnoException('FileSystem', 'stat'),
    handleBadArgument('stat'),
  );
  return (path: string) => Effect.map(nodeStat(path), makeFileInfo);
})();

// == symlink

const symlink = (() => {
  const nodeSymlink = effectify(
    memfs.fs.symlink,
    handleErrnoException('FileSystem', 'symlink'),
    handleBadArgument('symlink'),
  );
  return (target: string, path: string) => nodeSymlink(target, path);
})();

// == truncate

const truncate = (() => {
  const nodeTruncate = effectify(
    memfs.fs.truncate,
    handleErrnoException('FileSystem', 'truncate'),
    handleBadArgument('truncate'),
  );
  return (path: string, length?: FileSystem.SizeInput) =>
    nodeTruncate(path, length !== undefined ? Number(length) : undefined);
})();

// == utimes

const utimes = (() => {
  const nodeUtimes = effectify(
    memfs.fs.utimes,
    handleErrnoException('FileSystem', 'utime'),
    handleBadArgument('utime'),
  );
  return (path: string, atime: number | Date, mtime: number | Date) =>
    nodeUtimes(path, atime, mtime);
})();

// == watch

const watchNode = (path: string) =>
  Stream.asyncScoped<FileSystem.WatchEvent, Error.PlatformError>(emit =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const watcher = memfs.fs.watch(path, {}, (event, path) => {
          if (!path) return;
          switch (event) {
            case 'rename': {
              emit.fromEffect(
                Effect.match(stat(path), {
                  onSuccess: _ => FileSystem.WatchEventCreate({ path }),
                  onFailure: _ => FileSystem.WatchEventRemove({ path }),
                }),
              );
              return;
            }
            case 'change': {
              emit.single(FileSystem.WatchEventUpdate({ path }));
              return;
            }
          }
        });
        watcher.on('error', error => {
          emit.fail(
            Error.SystemError({
              module: 'FileSystem',
              reason: 'Unknown',
              method: 'watch',
              pathOrDescriptor: path,
              message: error.message,
            }),
          );
        });
        watcher.on('close', () => {
          emit.end();
        });
        return watcher;
      }),
      watcher =>
        Effect.sync(() => {
          watcher.close();
        }),
    ),
  );

const watch = (
  backend: Option.Option<Context.Tag.Service<FileSystem.WatchBackend>>,
  path: string,
) =>
  stat(path).pipe(
    Effect.map(stat =>
      backend.pipe(
        Option.flatMap(_ => _.register(path, stat)),
        Option.getOrElse(() => watchNode(path)),
      ),
    ),
    Stream.unwrap,
  );

// == writeFile

const writeFile = (
  path: string,
  data: Uint8Array,
  options?: FileSystem.WriteFileOptions,
) => {
  console.log('options', options);
  return Effect.async<void, Error.PlatformError>((resume, signal) => {
    try {
      memfs.fs.writeFile(path, data, { signal }, (err: unknown) => {
        if (err) {
          resume(
            Effect.fail(
              handleErrnoException('FileSystem', 'writeFile')(err, [path]),
            ),
          );
        } else {
          resume(Effect.void);
        }
      });
    } catch (err) {
      console.log('err', err);
      resume(Effect.fail(handleBadArgument('writeFile')(err)));
    }
  });
};

const MockFileSystem = FileSystem.make({
  access,
  chmod,
  chown,
  copy,
  copyFile,
  link,
  makeDirectory,
  makeTempDirectory,
  makeTempDirectoryScoped,
  makeTempFile,
  makeTempFileScoped,
  open,
  // @ts-expect-error Not Needed
  readDirectory,
  readFile,
  // @ts-expect-error Not Needed
  readLink,
  // @ts-expect-error Not Needed
  realPath,
  remove,
  rename,
  stat,
  symlink,
  truncate,
  utimes,
  writeFile,
  // @ts-expect-error Not Needed
  watch(path) {
    return path;
  },
});

export const layer = Layer.effect(FS.FS, Effect.succeed(MockFileSystem));
