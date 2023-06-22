import { TemplateFileError } from '../error';

describe('error', () => {
  describe(TemplateFileError.name, () => {
    it('toString', () => {
      const result = new TemplateFileError({ cause: '' }).toString();
      expect(result).toMatchInlineSnapshot(
        '"Writing to file failed, please report this."',
      );
    });
  });
});
