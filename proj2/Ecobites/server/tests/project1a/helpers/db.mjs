/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: isolate MongoMemoryServer lifecycle for Project 1a tests
 *
 * Step 1 — beforeAll: spin up in-memory MongoDB and connect Mongoose (60s timeout).
 * Step 2 — afterEach: wipe all collections so tests do not leak state.
 * Step 3 — afterAll: tear down the memory server and close connections.
 *
 * Each UC test file calls setupProject1aDb() once at module load.
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
