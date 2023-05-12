// type FileNameFormatter =
// | 'PascalCase'
// | 'camelCase'
// | 'lower-kebab-case'
// | 'Upper-Kebab-Case';

export type Config = {
  /**
   * Global settings that apply to all template options
   * Overridable within templates
   */
  options?: {
    /**
     * Sets the root for pathing on relative paths
     */
    rootOutDir: string;
    templatesDirectories: string[];
  };
  /**
   * List of templates for the CLI to render
   */
  templates: Record<string, TemplateSettings>;
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
