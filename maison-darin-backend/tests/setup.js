// Test setup file
// This file runs before all tests

const testUtils = require('./helpers/utils');
const dbHelper = require('./helpers/database');
const factory = require('./factories');

// Set up test environment
testUtils.setupTestEnv();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = testUtils;
global.dbHelper = dbHelper;
global.factory = factory;

// Global test timeout
jest.setTimeout(30000);

// Mock Cloudinary for all tests
jest.mock('cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      public_id: 'test-image-id',
      secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
      width: 800,
      height: 600,
      bytes: 1024000,
      format: 'jpg'
    }),
    destroy: jest.fn().mockResolvedValue({
      result: 'ok'
    })
  }
}));

// Mock logger for all tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Setup and teardown hooks
beforeAll(async () => {
  // Connect to test database
  try {
    await dbHelper.connect();
  } catch (error) {
    console.warn('Database connection failed, running tests in mock mode');
  }
});

afterAll(async () => {
  // Cleanup
  await dbHelper.disconnect();
  testUtils.cleanupTestEnv();
});

beforeEach(async () => {
  // Clear database before each test
  if (dbHelper.isConnected()) {
    await dbHelper.clearDatabase();
  }
  
  // Reset factory counters
  factory.reset();
});

afterEach(async () => {
  // Clear any remaining data
  if (dbHelper.isConnected()) {
    await dbHelper.clearDatabase();
  }
});