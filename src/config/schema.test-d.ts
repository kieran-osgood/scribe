import BaseConfig from './base';
import { ScribeConfig } from './schema';

describe('Config', () => {
  describe('BaseConfig', () => {
    it('Type matches ScribeConfig', () => {
      assertType<ScribeConfig>(BaseConfig);
    });
  });
});
