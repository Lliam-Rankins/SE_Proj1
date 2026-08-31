/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: load Express app with axios mocked so createOrder tests run without live Nominatim
 *
 * Step 1 — Mock axios before the app imports it, so geocoding calls return empty data
 *          instead of hitting the real Nominatim API (slow / flaky in CI).
 * Step 2 — Dynamically import the Express app after the mock is registered.
 * Step 3 — Export the app for supertest agents in auth/fixtures and all UC test files.
 */
import { jest } from '@jest/globals';

// Replace axios with stubs: GET returns no geocode hits, POST is a no-op.
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(async () => ({ data: [] })),
    post: jest.fn(async () => ({ data: {} })),
  },
}));

// App loads after mock; createOrder falls back to Raleigh hash when geocoding yields nothing.
const { default: app } = await import('../../../src/app.js');
export default app;
