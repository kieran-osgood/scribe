export type ScribeConfig = {
  /**
   * Global settings that apply to all template options
   * Overridable within templates
   */
  options?: GlobalOptions;
  /**
   * List of templates for the CLI to render
   */
  templates: Record<string, TemplateSettings>;
};

export type GlobalOptions = {
  /**
   * Sets the root for pathing on relative paths
   */
  rootOutDir: string;
  /**
   * Directories to discover `*.scribe` files
   */
  templatesDirectories: string[];
};

export type TemplateSettings = {
  output?: {
    directory?: string;
  };
  outputs: Template[];
};

export type Template = {
  templateFileKey: string;
  output: {
    directory: string;
    fileName: string;
  };
};
