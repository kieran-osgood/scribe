// type FileNameFormatter = 'PascalCase' | 'camelCase' | 'lower-kebab-case' | 'Upper-Kebab-Case'

type Template = {
  template: string
  output: {
    directory?: string
    fileName: string
  }
}

type TemplateSettings = {
  output?: {
    directory?: string
  }
  outputs: Template[]
}

type Config = {
  // Global settings that apply to all template options
  // Overrideable within option settings
  global: {
    // fileNameFormatter: FileNameFormatter
    /**
     * Sets the root for pathing on relative paths
     */
    rootOutDir: string
  },
  // List of templates for the CLI to render
  templates: Record<string, TemplateSettings>
}

const config: Config = {
  global: { rootOutDir: '' },
  templates: {
    view: {
      output: {
        directory: 'src/screens'
      },
      outputs: [
        {
          template: 'templates/view.ejs',
          output: { fileName: '$NAME$View' }
        },
        {
          template: 'templates/view-model.ejs',
          output: { fileName: 'use$NAME$ViewModel' }
        }
      ]
    }
  }
};

export default config;