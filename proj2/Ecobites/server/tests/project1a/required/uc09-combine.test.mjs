/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC9 Combine orders with neighbors
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  createSeededOrder,
  nearbyAddress,
  farAddress,
  raleighAddress,
  User,
} from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('UC09 Combine orders with neighbors', () => {
  test('UC09-T01 test_combines_nearby_orders_in_same_city_and_zip', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: two PLACED orders with nearby Raleigh addresses.
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: raleighAddress(),
    });
    await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: nearbyAddress(),
    });

    // Act: customer initiates combine within 500m radius.
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
      radiusMeters: 500,
    });
    // Assert: both orders COMBINED and share a group id.
    expect(res.status).toBe(200);
    expect(res.body.combinedOrders.length).toBeGreaterThanOrEqual(2);
    expect(res.body.combinedOrders.every((o) => o.status === 'COMBINED')).toBe(
      true
    );
    expect(res.body.combinedOrders[0].combineGroupId).toBeTruthy();
  });

  test('UC09-T02 test_awards_20_eco_points_to_each_participant', async () => {
    const ctx = await seedMarketplaceActors();
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: raleighAddress(),
    });
    await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: nearbyAddress(),
    });
    // Snapshot reward points before combine.
    const beforeA = (await User.findById(ctx.customer._id)).rewardPoints || 0;
    const beforeB = (await User.findById(ctx.neighbor._id)).rewardPoints || 0;

    await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });

    // Assert: each participant gains exactly 20 combine bonus points.
    const afterA = (await User.findById(ctx.customer._id)).rewardPoints;
    const afterB = (await User.findById(ctx.neighbor._id)).rewardPoints;
    expect(afterA - beforeA).toBe(20);
    expect(afterB - beforeB).toBe(20);
  });

  test('UC09-T03 test_returns_empty_when_no_neighbors', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: only one active order (no neighbor match).
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(200);
    expect(res.body.combinedOrders).toEqual([]);
    expect(res.body.message).toMatch(/no nearby/i);
  });

  test('UC09-T04 test_rejects_when_customer_has_no_active_order', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: combine with no orders at all for this customer.
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/don't have any active orders/i);
  });

  test('UC09-T05 test_does_not_combine_different_city_or_zip', async () => {
    const ctx = await seedMarketplaceActors();
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: raleighAddress(),
    });
    // Neighbor order in Durham — different city/zip.
    await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: farAddress(),
    });
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(200);
    expect(res.body.combinedOrders).toEqual([]);
  });

  test('UC09-T06 test_does_not_combine_ACCEPTED_only_orders', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: orders already past PLACED — not eligible for combine.
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'ACCEPTED',
      deliveryAddress: raleighAddress(),
    });
    await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'ACCEPTED',
      deliveryAddress: nearbyAddress(),
    });
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/don't have any active orders/i);
  });
});
