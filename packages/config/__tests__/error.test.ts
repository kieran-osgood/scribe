import { CHECK_CONFIG_TIP, CosmicConfigError } from '../error.js';

const message = 'some additional message';

type TestCases = [
  errorCode: CosmicConfigError['errorCode'],
  message: string | undefined,
  expected: string,
];

const TestCases = [
  [
    'COSMIC_CONFIG_CONSTRUCTOR_ERROR',
    undefined,
    `Config Read Error: Unexpected error, failed to construct searcher.\n${CHECK_CONFIG_TIP}`,
  ],
  [
    'COSMIC_CONFIG_CONSTRUCTOR_ERROR',
    message,
    `Config Read Error: Unexpected error, failed to construct searcher.\n${message}\n${CHECK_CONFIG_TIP}`,
  ],
  //
  [
    'READ_FAILED',
    undefined,
    `Config Read Error: Read failed, check permissions.\n${CHECK_CONFIG_TIP}`,
  ],
  [
    'READ_FAILED',
    message,
    `Config Read Error: Read failed, check permissions.\n${message}\n${CHECK_CONFIG_TIP}`,
  ],
  //
  [
    'EMPTY_CONFIG',
    undefined,
    `Config Read Error: Config is empty, have you exported?\n${CHECK_CONFIG_TIP}`,
  ],
  [
    'EMPTY_CONFIG',
    message,
    `Config Read Error: Config is empty, have you exported?\n${message}\n${CHECK_CONFIG_TIP}`,
  ],
  //
  [
    'INVALID_CONFIG',
    undefined,
    `Config Read Error: Invalid config.\n${CHECK_CONFIG_TIP}`,
  ],
  [
    'INVALID_CONFIG',
    message,
    `Config Read Error: Invalid config.\n${message}\n${CHECK_CONFIG_TIP}`,
  ],
  //
  [
    'MISSING_GENERATORS',
    undefined,
    `Config Read Error: No Generators found.\n${CHECK_CONFIG_TIP}`,
  ],
  [
    'MISSING_GENERATORS',
    message,
    `Config Read Error: No Generators found.\n${message}\n${CHECK_CONFIG_TIP}`,
  ],
] satisfies TestCases[];

describe(CosmicConfigError.name, () => {
  it.each<TestCases>(TestCases)(
    'CosmicConfig({ errorCode: %s, message: %s }).toString()',
    (errorCode, message, expected) => {
      const actual = new CosmicConfigError({ errorCode, message }).toString();

      expect(actual).toBe(expected);
    },
  );
});
