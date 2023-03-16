import type { Config } from "./src/config";

const config: Config = {
  global: {
    rootOutDir: ".",
    templatesDirectories: ["."],
  },
  templateOptions: {
    screen: {
      outputs: [
        {
          template: "screen",
          output: {
            directory: "src/screens",
            fileName: "PascalCase",
          },
        },
      ],
    },
  },
};

export default config;
