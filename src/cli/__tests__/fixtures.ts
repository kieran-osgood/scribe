import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import * as child_process from 'child_process';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import * as tempy from 'tempy';

export const cliPath = path.join(process.cwd(), 'dist', 'index.js');
export const configFlag = path.join('scribe.config.ts');

function isSpawnResult(
  errorOrResult: Error,
): errorOrResult is Error & SpawnResult {
  return (
    'pid' in errorOrResult &&
    'stdout' in errorOrResult &&
    'stderr' in errorOrResult
  );
}

export async function runAsync(
  args: string[],
  options?: SpawnOptions,
): Promise<SpawnResult> {
  const promise = spawnAsync(cliPath, args, options);
  promise.child.stdout?.pipe(process.stdout);
  promise.child.stderr?.pipe(process.stderr);
  try {
    return await promise;
  } catch (error: unknown) {
    if (error instanceof Error && isSpawnResult(error)) {
      if (error.stdout) error.message += `\n------\nSTDOUT:\n${error.stdout}`;
      if (error.stderr) error.message += `\n------\nSTDERR:\n${error.stderr}`;
    }
    throw error;
  }
}

export async function tryRunAsync(
  args: string[],
  options?: SpawnOptions,
): Promise<SpawnResult> {
  try {
    return await runAsync(args, options);
  } catch (error: unknown) {
    if (error instanceof Error && isSpawnResult(error)) {
      return error;
    }
    throw error;
  }
}

type CreateMinimalProjectOptions = {
  git?: {
    init: boolean;
    dirty: boolean;
  };
  fixtures?: {
    configFile: boolean;
    templateFiles: boolean;
    base: boolean;
  };
};
const defaultMinimalProjectOptions = {
  fixtures: {
    configFile: true,
    templateFiles: true,
    base: true,
  },
  git: { init: true, dirty: false },
} satisfies CreateMinimalProjectOptions;

export function createMinimalProject(_options?: CreateMinimalProjectOptions) {
  const options = { ...defaultMinimalProjectOptions, ..._options };
  const fixturesPathParts = ['src', 'common', 'test-fixtures'];
  const realFixtures = path.join(process.cwd(), ...fixturesPathParts);

  const tmp = tempy.temporaryDirectory();
  const tmpFixtures = path.join(tmp, 'src', 'common', 'test-fixtures');
  fs.mkdirSync(tmpFixtures, { recursive: true });
  fs.mkdirSync(path.join(tmp, 'public'), { recursive: true });

  // Allows git commit to pass even when fixtures are all off
  fs.writeFileSync(path.join(tmp, 'dummyfile'), 'dummy');

  if (options.fixtures.configFile) {
    copyFileToPath({
      readPath: path.join(realFixtures, 'scribe.config.ts'),
      writePath: path.join(tmp, 'scribe.config.ts'),
    });
  }

  if (options.fixtures.base) {
    copyFileToPath({
      readPath: path.join('public', 'base.ts'),
      writePath: path.join(tmp, 'public', `base.ts`),
    });
  }

  if (options.fixtures.templateFiles) {
    copyFileToPath({
      readPath: path.join(realFixtures, 'screen.scribe'),
      writePath: path.join(tmpFixtures, `screen.scribe`),
    });
    copyFileToPath({
      readPath: path.join(realFixtures, 'screen.test.scribe'),
      writePath: path.join(tmpFixtures, 'screen.test.scribe'),
    });
  }

  if (options.git.init) {
    const execOpts = {
      cwd: tmp,
    } satisfies child_process.ExecSyncOptionsWithBufferEncoding;

    child_process.execSync('git init', execOpts);
    child_process.execSync('git config user.name "kieran"', execOpts);
    child_process.execSync('git config user.email "ko@gmail.com"', execOpts);
    if (!options.git.dirty) {
      child_process.execSync('git add .', execOpts);
      child_process.execSync(
        'git commit -m "non empty commit message"',
        execOpts,
      );
    }
  }

  return tmp;
}

type CopyFileOptions = {
  writePath: string;
  readPath: string;
};
const copyFileToPath = ({ writePath, readPath }: CopyFileOptions) => {
  fs.writeFileSync(writePath, fs.readFileSync(readPath));
};

export const arrowKey = {
  up: '\u001b[A',
  down: '\u001b[B',
  left: '\u001b[D',
  right: '\u001b[C',
};

const createDataListener = (cli: ChildProcess) => (cb: (s: string) => void) => {
  cli.stdout?.on('data', (data: { toString(): string }) => {
    cb(data.toString());
  });
};

type Responses = {
  continue?: 'y' | 'n';
  templatePicker?: string;
  fileName?: string;
};

export const registerInteractiveListeners = (cli: ChildProcess) => {
  return (responses: Responses) => {
    const registerOnDataListener = createDataListener(cli);

    if (responses.continue) {
      registerOnDataListener(s => {
        if (s.includes('Continue?'))
          cli.stdin?.write(`${responses.continue}\n`);
      });
    }

    if (responses.templatePicker) {
      registerOnDataListener(s => {
        if (s.includes('Pick your template'))
          cli.stdin?.write(`${responses.templatePicker}\n`);
      });
    }

    if (responses.fileName) {
      registerOnDataListener(s => {
        if (s.includes('File name'))
          cli.stdin?.write(`${responses.fileName}\n`);
      });
    }
  };
};

export const getCliFromSpawn = (
  _: spawnAsync.SpawnPromise<spawnAsync.SpawnResult>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (_.child === null) {
    throw new Error('spawned process is null');
  }

  return _.child;
};
