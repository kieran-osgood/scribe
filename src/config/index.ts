// type FileNameFormatter = 'PascalCase' | 'camelCase' | 'lower-kebab-case' | 'Upper-Kebab-Case'

type Template = {
  template: string;
  output: {
    directory?: string;
    fileName: string;
  };
};

type TemplateSettings = {
  output?: {
    directory?: string;
  };
  outputs: Template[];
};

export type Config = {
  // Global settings that apply to all template options
  // Overrideable within option settings
  global: {
    // fileNameFormatter: FileNameFormatter
    /**
     * Sets the root for pathing on relative paths
     */
    rootOutDir: string;

    templatesDirectories: string[];
  };
  // List of templates for the CLI to render
  templateOptions: Record<string, TemplateSettings>;
};
