import { test } from 'vitest';

import { center, file, spacer } from '../formatter.js';

describe('Formatter', () => {
  describe('file()', () => {
    test('empty string', () => {
      const result = file('');
      expect(result).toBe('file://');
    });

    test('any string', () => {
      const result = file('abc');
      expect(result).toBe('file://abc');
    });
  });

  describe('center()', () => {
    process.stdout.columns = 10;

    test('empty string', () => {
      const result = center('');
      expect(result).toHaveLength(10);
      expect(result).toBe('          ');
    });

    test('any string', () => {
      const result = center('abc');
      expect(result).toHaveLength(9);
      expect(result).toBe('   abc   ');
    });
  });

  describe('spacer()', () => {
    test('empty string', () => {
      const result = spacer('');
      expect(result).toBe('  ');
    });

    test('any string', () => {
      const s = 'abc';
      const result = spacer(s);
      expect(result).toHaveLength(s.length + 2);
      expect(result).toBe(` ${s} `);
    });
  });
});
