// Global test setup
import { jest } from '@jest/globals';

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error'; // Reduce noise in tests

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  // Reduce console noise during tests
  console.log = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  
  // Keep error/debug for test debugging
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);

// Add custom matchers or global test utilities here
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare custom matcher types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}