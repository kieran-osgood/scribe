import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import path from 'path';
import * as fs from 'fs';

const cliPath = path.join(process.cwd(), 'dist', 'index.js');

function isSpawnResult(
  errorOrResult: Error
): errorOrResult is Error & SpawnResult {
  return (
    'pid' in errorOrResult &&
    'stdout' in errorOrResult &&
    'stderr' in errorOrResult
  );
}

export async function runAsync(
  args: string[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  const promise = spawnAsync(cliPath, args, options);
  promise.child.stdout?.pipe(process.stdout);
  promise.child.stderr?.pipe(process.stderr);
  try {
    return await promise;
  } catch (error: any) {
    if (isSpawnResult(error)) {
      if (error.stdout) error.message += `\n------\nSTDOUT:\n${error.stdout}`;
      if (error.stderr) error.message += `\n------\nSTDERR:\n${error.stderr}`;
    }
    throw error;
  }
}

export async function tryRunAsync(
  args: string[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  try {
    return await runAsync(args, options);
  } catch (error: any) {
    if (isSpawnResult(error)) {
      return error;
    }
    throw error;
  }
}

export function createMinimalProject(projectRoot: string) {
  // Create the project root
  fs.mkdirSync(projectRoot, { recursive: true });

  fs.mkdirSync(path.join(projectRoot, 'test'));
  readAndWriteFixture(
    projectRoot,
    'scribe.config.ts',
    './test/scribe.config.ts'
  );
  readAndWriteFixture(
    projectRoot,
    './test/screen.scribe',
    './test/screen.scribe'
  );
  readAndWriteFixture(
    projectRoot,
    './test/screen.test.scribe',
    './test/screen.scribe'
  );
}

const readAndWriteFixture = (
  projectRoot: string,
  writePath: string,
  readPath: string
) => {
  const _writePath = path.join(projectRoot, writePath);
  fs.writeFileSync(_writePath, fs.readFileSync(readPath));
};

export const arrowKey = {
  up: '\u001b[A',
  down: '\u001b[B',
  left: '\u001b[D',
  right: '\u001b[C',
};
