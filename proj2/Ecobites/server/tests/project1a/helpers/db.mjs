/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: isolate MongoMemoryServer lifecycle for Project 1a tests
 */
import { connectDB, closeDB, clearDB } from '../../../src/setupTests.js';

export const setupProject1aDb = () => {
  beforeAll(async () => {
    await connectDB();
  }, 60000);

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  }, 60000);
};

export { connectDB, closeDB, clearDB };
