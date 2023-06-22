import { ConfigParseError, CosmicConfigError } from '../error';

describe('error', () => {
  describe(CosmicConfigError.name, () => {
    it('toString() should format error', () => {
      const result = new CosmicConfigError({
        error: 'invalid config',
      }).toString();
      expect(result).toEqual('Config Read Error: invalid config');
    });
  });

  describe(ConfigParseError.name, () => {
    it('tree format ', () => {
      const errors = [
        { _tag: 'Key', key: 'templates', errors: [{ _tag: 'Missing' }] },
      ] as const;

      const result = new ConfigParseError({
        path: 'config.ts',
        errors,
      }).toString();

      expect(result).toMatchInlineSnapshot(`
        "⚠️ Config parsing error: 'config.ts' 
         error(s) found
        └─ [\\"templates\\"]
           └─ is missing"
      `);
    });
  });
});
