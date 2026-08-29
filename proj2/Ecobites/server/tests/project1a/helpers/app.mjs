/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: load Express app with axios mocked so createOrder tests run without live Nominatim
 */
import { jest } from '@jest/globals';

await jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(async () => ({ data: [] })),
    post: jest.fn(async () => ({ data: {} })),
  },
}));

const { default: app } = await import('../../../src/app.js');
export default app;
