import { Config } from "../config/index.js";

const config: Config = {
  global: {
    rootOutDir: ".",
    templatesDirectories: ["./templates"],
  },
  templateOptions: {
    screen: {
      output: { directory: "./src/screens" },
      outputs: [
        {
          template: "view.ejs",
          output: { fileName: "$NAME$View" },
        },
        {
          template: "view-model.ejs",
          output: { fileName: "use$NAME$ViewModel" },
        },
        {
          template: "styles.ejs",
          output: { fileName: "$NAME$.styles.ts", directory: "./styles" },
        },
      ],
    },
    hook: {
      output: { directory: "./src/hooks" },
      outputs: [
        {
          template: "hooks.ejs",
          output: { fileName: "use$NAME$" },
        },
      ],
    },
  },
};

export default config;
