// type FileNameFormatter =
// | 'PascalCase'
// | 'camelCase'
// | 'lower-kebab-case'
// | 'Upper-Kebab-Case';

export type Config = {
  // Global settings that apply to all template options
  // Overridable within templateOptions
  global: {
    /**
     * Sets the root for pathing on relative paths
     */
    rootOutDir: string;
    templatesDirectories: string[];
    // fileNameFormatter: FileNameFormatter
  };
  // List of templates for the CLI to render
  templateOptions: Record<string, TemplateSettings>;
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
    // case: FileNameFormatter;
  };
};
