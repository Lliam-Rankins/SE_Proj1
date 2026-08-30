/**
 * Test: packaging preference adds ecoRewardPoints to order at creation (passing)
 * This test asserts that ecoRewardPoints on the created order includes packaging points
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import { seedMarketplaceActors, placeOrderViaApi } from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('FINDING UC14 packaging on order', () => {
  test('UC14-F01 test_packaging_points_present_on_created_order', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await placeOrderViaApi(ctx.customerAgent, {
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItemId: ctx.menuItem._id,
      packagingPreference: 'reusable',
    });

    expect(res.status).toBe(201);
    // reusable => 30 points as per constants
    expect(res.body.ecoRewardPoints).toBeGreaterThanOrEqual(30);
  });
});
