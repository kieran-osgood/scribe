import { readUserConfig } from "./reader/config.js";
import { readFlags } from "./reader/arguments.js";
import { readPrompt } from "./reader/prompt.js";
import { fileNameFormatter } from "./writer/string.js";

export async function run() {
  const choices = await readUserConfig();
  const flags = await readFlags(choices);
  const selections = await readPrompt(choices, flags);

  if (selections.success === false) {
    throw new Error("Failed!");
  }
  // Write files based on selections.template option
  const fileName = fileNameFormatter(
    selections.data.template,
    selections.data.name
  );
  console.log(fileName);
}
