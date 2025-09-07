import { config } from 'dotenv';
import path from 'path';
import { jest } from '@jest/globals';

// Load test environment variables
const envPath = path.resolve(__dirname, '../.env.test');
config({ path: envPath });

// Set test timeout to 30s
jest.setTimeout(30000);

// Add type definitions for test globals
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __TEST__: boolean;
    }
  }
}

// Global test setup
beforeAll(async () => {
  // Set test environment flag
  global.__TEST__ = true;
});

afterAll(async () => {
  // Clean up any resources
  global.__TEST__ = false;
});

// Global test utilities
export {};
