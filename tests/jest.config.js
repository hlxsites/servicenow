/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  // All imported modules in your tests should be mocked automatically
  automock: false,

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // The paths to modules that run some code to configure or set up the testing
  //  environment before each test
  // setupFiles: [],
  setupFiles: ['./setupJest.js'],

  // A list of paths to modules that run some code to configure or set up the
  //  testing framework before each test
  setupFilesAfterEnv: [],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // An array of regexp patterns that are matched against all source file
  //  paths before re-running tests in watch mode
  // watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // watchman: true,
  injectGlobals: true,
  transform: {},
};

// module.exports = config;
export default config;
