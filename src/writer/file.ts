import * as fs from "fs-extra";
// import * as path from 'path';
// import * as shell from 'shelljs';
// import chalk from 'chalk';

export function createFile(fileName: string, contents: string) {
  return fs.outputFileSync(fileName, contents);
}
