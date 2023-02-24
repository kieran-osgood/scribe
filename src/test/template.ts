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

    templatesDirectories: string[]
  },
  // List of templates for the CLI to render
  templateOptions: Record<string, TemplateSettings>
}

const config: Config = {
  global: {
    rootOutDir: '.',
    templatesDirectories: ['./templates']
  },
  templateOptions: {
    screen: {
      output: { directory: './src/screens' },
      outputs: [
        {
          template: 'view.ejs',
          output: { fileName: '$NAME$View' }
        },
        {
          template: 'view-model.ejs',
          output: { fileName: 'use$NAME$ViewModel' }
        },
        {
          template: 'styles.ejs',
          output: { fileName: '$NAME$.styles.ts', directory: './styles' }
        }
      ]
    },
    hook: {
      output: { directory: './src/hooks' },
      outputs: [
        {
          template: 'hooks.ejs',
          output: { fileName: 'use$NAME$' }
        }
      ]
    }

  }
};

export default config;