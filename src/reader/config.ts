import * as TE from "fp-ts/lib/TaskEither.js";
import * as fs from "fs-extra";
import { pipe } from "fp-ts/lib/function.js";
import { formatErrorMessage } from "../error/index.js";

// https://github.com/gcanti/fp-ts/discussions/1426

const readConfigPromise = async (filePath: string): Promise<string> =>
  fs.readFile(filePath).then((buffer) => buffer.toString());

const readConfigTask = TE.tryCatchK(
  readConfigPromise,
  (error) => new Error(formatErrorMessage(error))
);

type ReadUserConfigValue = {
  templateOptions: Record<string, unknown>;
};
type ReadUserConfigError = "invalid config";
type ReadUserConfig = () => TE.TaskEither<
  ReadUserConfigError,
  ReadUserConfigValue
>;
export const readUserConfig: ReadUserConfig = () => {
  return TE.of<ReadUserConfigError, ReadUserConfigValue>({
    templateOptions: {
      screen: {},
      hook: {},
    },
  });
};

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
type UserTemplateOptionsValue = string[];
type UserTemplateOptionsError = "invalid config";
type GetUserTemplateOptions = () => TE.TaskEither<
  UserTemplateOptionsError,
  UserTemplateOptionsValue
>;
export const readUserTemplateOptions: GetUserTemplateOptions = () =>
  pipe(
    readUserConfig(), //
    TE.map(getTemplateKeys)
  );

const getTemplateKeys = (config: ReadUserConfigValue) =>
  Object.keys(config.templateOptions);
