import { describe, expect, it } from 'vitest';

import { TemplateFileError } from './error';

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
