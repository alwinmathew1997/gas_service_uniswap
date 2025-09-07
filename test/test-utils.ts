import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';

/**
 * Creates a test application with the given module metadata
 */
export async function createTestApp(moduleMetadata: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule(moduleMetadata).compile();
  const app = moduleFixture.createNestApplication();
  
  // Apply global pipes, filters, guards, etc.
  // app.useGlobalPipes(new ValidationPipe());
  
  await app.init();
  return app;
}

/**
 * Creates a test application with the main AppModule
 */
export async function createTestAppWithAppModule(): Promise<INestApplication> {
  return createTestApp({
    imports: [AppModule],
  });
}

/**
 * Creates a mocked ConfigService with the given configuration
 */
export function createMockConfigService(config: Record<string, any>): ConfigService {
  return {
    get: jest.fn((key: string) => config[key]),
  } as any;
}

/**
 * Sleep for the specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to generate a random Ethereum address
 */
export function randomAddress(): string {
  return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

/**
 * Helper to generate a random big number as a string
 */
export function randomBigNumber(digits: number = 18): string {
  return Math.floor(Math.random() * 10 ** digits).toString();
}
