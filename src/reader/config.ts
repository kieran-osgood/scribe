import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import { B, pipe, TE } from "../common/fp";

const explorer = cosmiconfig("test", {
  loaders: {
    ".ts": TypeScriptLoader(),
  },
});

// function throwFormattedError(error: unknown) {
//   return new Error(formatErrorMessage(error));
// }

// const isEmptyPredicate = TE.fromPredicate(
//   (isEmpty: undefined | boolean) => isEmpty === false || isEmpty === undefined,
//   () => "invalid config"
// );

const readConfigTask = (
  path: string
): TE.TaskEither<ReadUserConfigError, ReadUserConfigValue> =>
  pipe(
    TE.tryCatch(
      () => explorer.load(path),
      (err) => `[read config failed] ${err}` as const
    ),
    TE.chainW((result) =>
      pipe(
        Boolean(result?.isEmpty),
        B.match(
          () => TE.right(result?.config as ReadUserConfigValue),
          () => TE.left("Empty Config" as const)
        )
      )
    )
  );

type ReadUserConfigValue = {
  templateOptions: Record<string, unknown>;
};
type ReadUserConfigError =
  | `[read config failed] ${string}`
  | "invalid config"
  | "Empty Config"
  | "No template options found";
type ReadUserConfig = (
  path: string
) => TE.TaskEither<ReadUserConfigError, ReadUserConfigValue>;
export const readUserConfig: ReadUserConfig = (path: string) => {
  return readConfigTask(path);
};

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
type UserTemplateOptionsValue = string[];
type UserTemplateOptionsError = ReadUserConfigError;

type GetUserTemplateOptions = (opts: {
  configPath: string;
}) => TE.TaskEither<UserTemplateOptionsError, UserTemplateOptionsValue>;
export const readUserTemplateOptions: GetUserTemplateOptions = (opts) =>
  pipe(
    opts.configPath, //
    readUserConfig,
    TE.map(getTemplateKeys),
    TE.chain((keys) =>
      keys.length > 0
        ? TE.right(keys)
        : TE.left("No template options found" as const)
    )
  );

const getTemplateKeys = (config: ReadUserConfigValue): string[] =>
  Object.keys(config.templateOptions);
