import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import path from 'path';
import * as fs from 'fs';
import * as tempy from 'tempy';
import * as child_process from 'child_process';

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

type CreateMinimalProjectOptions = {
  initGit?: boolean;
};

export function createMinimalProject(
  options: CreateMinimalProjectOptions = { initGit: true }
) {
  const projectRoot = tempy.temporaryDirectory();
  const testPath = path.join(projectRoot, 'test');
  fs.mkdirSync(testPath, { recursive: true });

  readAndWriteFixture(
    projectRoot,
    path.join(projectRoot, 'scribe.config.ts'),
    './test/scribe.config.ts'
  );
  readAndWriteFixture(
    projectRoot,
    path.join(testPath, `screen.scribe`),
    './test/screen.scribe'
  );
  readAndWriteFixture(
    projectRoot,
    path.join(testPath, 'screen.test.scribe'),
    './test/screen.scribe'
  );

  if (options?.initGit) {
    child_process.spawnSync('git init');
    child_process.spawnSync('git add .');
    child_process.spawnSync('git commit -m ""');
  }

  return projectRoot;
}

const readAndWriteFixture = (
  projectRoot: string,
  writePath: string,
  readPath: string
) => {
  fs.writeFileSync(writePath, fs.readFileSync(readPath));
  fs.existsSync(writePath);
};

export const arrowKey = {
  up: '\u001b[A',
  down: '\u001b[B',
  left: '\u001b[D',
  right: '\u001b[C',
};
