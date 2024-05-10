import { TemplateFileError } from './error.js';

describe('error', () => {
  describe(TemplateFileError.name, () => {
    it('toString', () => {
      const result = new TemplateFileError({ error: '' }).toString();
      expect(result).toMatchInlineSnapshot(
        '"Writing to file failed, please report this."',
      );
    });
  });
});
