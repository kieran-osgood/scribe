import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import * as child_process from 'child_process';
import * as fs from 'fs';
import path from 'path';
import * as tempy from 'tempy';

const cliPath = path.join(process.cwd(), 'dist', 'index.js');

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
  };
};
const defaultMinimalProjectOptions = {
  fixtures: {
    configFile: true,
    templateFiles: true,
  },
  git: { init: true, dirty: false },
} satisfies CreateMinimalProjectOptions;

export function createMinimalProject(_options?: CreateMinimalProjectOptions) {
  const options = { ...defaultMinimalProjectOptions, ..._options };

  const projectRoot = tempy.temporaryDirectory();
  const testPath = path.join(projectRoot, 'src', 'test-fixtures');
  fs.mkdirSync(testPath, { recursive: true });

  // Allows git commit to pass even when fixtures are all off
  fs.writeFileSync(path.join(projectRoot, 'dummyfile'), 'dummy');

  if (options.fixtures?.configFile) {
    copyFileToPath(
      projectRoot,
      path.join(projectRoot, 'scribe.config.ts'),
      './src/test-fixtures/scribe.config.ts',
    );
  }
  if (options.fixtures?.templateFiles) {
    copyFileToPath(
      projectRoot,
      path.join(testPath, `screen.scribe`),
      './src/test-fixtures/screen.scribe',
    );
    copyFileToPath(
      projectRoot,
      path.join(testPath, 'screen.test.scribe'),
      // TODO: WE'RE READING THE WRONG FILE
      './src/test-fixtures/screen.scribe',
    );
  }

  if (options?.git?.init) {
    const execOpts = {
      cwd: projectRoot,
    } satisfies child_process.ExecSyncOptionsWithBufferEncoding;

    child_process.execSync('git init', execOpts);
    child_process.execSync('git config user.name "kieran"', execOpts);
    child_process.execSync('git config user.email "ko@gmail.com"', execOpts);
    if (options.git.dirty === false) {
      child_process.execSync('git add .', execOpts);
      child_process.execSync(
        'git commit -m "non empty commit message"',
        execOpts,
      );
    }
  }

  return projectRoot;
}

const copyFileToPath = (
  projectRoot: string,
  writePath: string,
  readPath: string,
) => {
  fs.writeFileSync(writePath, fs.readFileSync(readPath));
};

export const arrowKey = {
  up: '\u001b[A',
  down: '\u001b[B',
  left: '\u001b[D',
  right: '\u001b[C',
};
