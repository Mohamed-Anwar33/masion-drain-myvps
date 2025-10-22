module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/standalone-compatibility.test.js'],
  testTimeout: 10000,
  setupFilesAfterEnv: [],
  setupFiles: [],
  // Skip the main setup file that connects to database
  testPathIgnorePatterns: ['/node_modules/', '/tests/setup.js']
};