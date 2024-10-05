import { BASE_CONFIG, URLS } from './constants.js';

describe('BASE_CONFIG', () => {
  it('should use the "name" property from package.json', () => {
    expect(BASE_CONFIG)
      .toBe(`import { ScribeConfig } from '@kieran-osgood/scribe';

export default {
  templatesDirectories: ['.'],
  generators: {},
} satisfies ScribeConfig;
`);
  });
});

describe('URLS', () => {
  it('Interpolates fine', () => {
    expect(URLS.github.issues).toBe(
      'https://github.com/kieran-osgood/scribe/issues',
    );

    expect(URLS.github.newIssue).toBe(
      'https://github.com/kieran-osgood/scribe/issues/new',
    );

    expect(URLS.github.readme).toBe(
      'https://github.com/kieran-osgood/scribe/blob/main/README.md',
    );
  });
});
