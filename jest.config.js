module.exports = {
  ...require('../jest.common'),
  displayName: 'API',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/dist'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}
