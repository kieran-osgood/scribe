import { CosmicConfigError } from '../error.js';

describe('error', () => {
  describe(CosmicConfigError.name, () => {
    it('toString() should format error', () => {
      const result = new CosmicConfigError({
        error: 'invalid config',
      }).toString();
      expect(result).toEqual('Config Read Error: invalid config');
    });
  });

  // describe(ConfigParseError.name, () => {
  //   it.skip('tree format ', () => {
  //     const result = new ConfigParseError({
  //       path: 'config.ts',
  //       parseError: parseError(),
  //     });
  //
  //     expect(result.toString()).toMatchInlineSnapshot(`
  //       "⚠️ Config parsing error: 'config.ts'
  //        error(s) found
  //       └─ ["templates"]
  //          └─ is missing"
  //     `);
  //   });
  // });
});
