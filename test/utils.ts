import { CliApp } from '@effect/cli';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import * as child_process from 'child_process';
import { Console, Effect, Layer } from 'effect';
import * as fs from 'fs';
import path from 'path';
import * as tempy from 'tempy';

import * as FS from '../packages/fs/index.js';
import * as Process from '../packages/process/index.js';
import * as MockConsole from './mock-console.js';
import * as MockTerminal from './mock-terminal.js';

export const cliPath = path.join(process.cwd(), 'dist', 'index.js');
export const configFlag = path.join('scribe.config.ts');

export const MainLive = (cwd: string) =>
  Effect.gen(function* ($) {
    const _console = yield* $(MockConsole.make);

    return Layer.mergeAll(
      NodeFileSystem.layer,
      FS.layer,
      MockTerminal.layer,
      Process.layer(cwd),
      NodePath.layer,
      Console.setConsole(_console),
    );
  }).pipe(Layer.unwrapEffect);

export const runEffect =
  (cwd: string) =>
  <A, E>(
    self: Effect.Effect<
      A,
      E,
      CliApp.CliApp.Environment | FS.FS | Process.Process
    >,
  ) =>
    Effect.provide(self, MainLive(cwd));

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
  const realFixturesPath = path.join(process.cwd(), 'test', 'fixtures');

  const tmpPath = tempy.temporaryDirectory();

  if (options.fixtures.configFile) {
    copyFileToPath({
      readPath: path.join(realFixturesPath, 'scribe.config.ts'),
      writePath: path.join(tmpPath, 'scribe.config.ts'),
    });
  }

  if (options.fixtures.templateFiles) {
    const tmpFixturesPath = path.join(tmpPath, 'test', 'fixtures');
    fs.mkdirSync(tmpFixturesPath, { recursive: true });

    copyFileToPath({
      readPath: path.join(realFixturesPath, 'templates', 'screen.scribe'),
      writePath: path.join(tmpFixturesPath, 'screen.scribe'),
    });
    copyFileToPath({
      readPath: path.join(realFixturesPath, 'templates', 'screen.test.scribe'),
      writePath: path.join(tmpFixturesPath, 'screen.test.scribe'),
    });
  }

  if (options.git.init) {
    // Allows git commit to pass even when fixtures are all off
    fs.writeFileSync(path.join(tmpPath, 'dummyfile'), 'dummy');

    const execOpts = {
      cwd: tmpPath,
    } satisfies child_process.ExecSyncOptionsWithBufferEncoding;

    child_process.execSync('git init --initial-branch main', execOpts);
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

  return tmpPath;
}

type CopyFileOptions = {
  writePath: string;
  readPath: string;
};
const copyFileToPath = ({ writePath, readPath }: CopyFileOptions) => {
  fs.writeFileSync(writePath, fs.readFileSync(readPath));
};
