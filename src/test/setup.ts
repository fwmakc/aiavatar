import { beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Use in-memory SQLite for all tests
process.env.TEST_DB_PATH = ':memory:';

// We need to re-import db after setting env var, but vitest hoists imports.
// Instead, we initialize the db connection in the test files that need it.
// This setup file ensures the env var is set before any test runs.

// Global fetch mock for AI API calls
global.fetch = vi.fn();

beforeAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  // Reset fetch mock between tests
  vi.mocked(global.fetch).mockReset();
});
