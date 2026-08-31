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
  Order,
} from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('UC09 Combine orders with neighbors', () => {
  test('UC09-T01 test_combines_nearby_orders_in_same_city_and_zip', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: two PLACED orders with nearby Raleigh addresses.
    const order1 = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: raleighAddress(),
    });
    const order2 = await createSeededOrder({
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
    expect(res.body.combinedOrders).toBeDefined();
    expect(Array.isArray(res.body.combinedOrders)).toBe(true);
    expect(res.body.combinedOrders.length).toBeGreaterThanOrEqual(2);
    expect(res.body.combinedOrders.every((o) => o.status === 'COMBINED')).toBe(true);
    
    // Verify all orders have the same combineGroupId
    const groupId = res.body.combinedOrders[0].combineGroupId;
    expect(groupId).toBeTruthy();
    expect(res.body.combinedOrders.every((o) => o.combineGroupId === groupId)).toBe(true);
    
    // Verify both order IDs are in the combined list
    const combinedIds = res.body.combinedOrders.map(o => String(o._id));
    expect(combinedIds).toContain(String(order1._id));
    expect(combinedIds).toContain(String(order2._id));
    
    // Verify persistence in DB
    const dbOrder1 = await Order.findById(order1._id);
    const dbOrder2 = await Order.findById(order2._id);
    expect(dbOrder1.status).toBe('COMBINED');
    expect(dbOrder2.status).toBe('COMBINED');
    expect(dbOrder1.combineGroupId).toBe(groupId);
    expect(dbOrder2.combineGroupId).toBe(groupId);
  });

  test('UC09-T02 test_awards_20_eco_points_to_each_participant', async () => {
    const ctx = await seedMarketplaceActors();
    const order1 = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: raleighAddress(),
    });
    const order2 = await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: nearbyAddress(),
    });
    // Snapshot reward points before combine.
    const beforeA = (await User.findById(ctx.customer._id)).rewardPoints || 0;
    const beforeB = (await User.findById(ctx.neighbor._id)).rewardPoints || 0;

    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });

    // Assert: response indicates success
    expect(res.status).toBe(200);
    expect(res.body.combinedOrders).toBeDefined();
    expect(res.body.combinedOrders.length).toBeGreaterThanOrEqual(2);

    // Assert: each participant gains exactly 20 combine bonus points.
    const afterA = (await User.findById(ctx.customer._id)).rewardPoints;
    const afterB = (await User.findById(ctx.neighbor._id)).rewardPoints;
    expect(afterA - beforeA).toBe(20);
    expect(afterB - beforeB).toBe(20);
    
    // Verify points are persisted
    expect(afterA).toBeGreaterThan(beforeA);
    expect(afterB).toBeGreaterThan(beforeB);
  });

  test('UC09-T03 test_returns_empty_when_no_neighbors', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: only one active order (no neighbor match).
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.combinedOrders).toBeDefined();
    expect(res.body.combinedOrders).toEqual([]);
    expect(res.body.message).toBeDefined();
    expect(res.body.message).toMatch(/no nearby|no other|no neighbors/i);
    
    // Verify original order remains PLACED (not modified)
    const dbOrder = await Order.findById(order._id);
    expect(dbOrder.status).toBe('PLACED');
  });

  test('UC09-T04 test_rejects_when_customer_has_no_active_order', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: combine with no orders at all for this customer.
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
    expect(res.body.message).toMatch(/don't have any active orders|no active|no.*order/i);
    
    // Verify no combine groups were created
    const orders = await Order.find({ customerId: ctx.customer._id });
    expect(orders).toHaveLength(0);
  });

  test('UC09-T05 test_does_not_combine_different_city_or_zip', async () => {
    const ctx = await seedMarketplaceActors();
    const order1 = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: raleighAddress(),
    });
    // Neighbor order in Durham — different city/zip.
    const order2 = await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      deliveryAddress: farAddress(),
    });
    const res = await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    expect(res.status).toBe(200);
    expect(res.body.combinedOrders).toBeDefined();
    expect(Array.isArray(res.body.combinedOrders)).toBe(true);
    expect(res.body.combinedOrders).toEqual([]);
    expect(res.body.message).toMatch(/no nearby|no other/i);
    
    // Verify both orders remain PLACED and separate
    const dbOrder1 = await Order.findById(order1._id);
    const dbOrder2 = await Order.findById(order2._id);
    expect(dbOrder1.status).toBe('PLACED');
    expect(dbOrder2.status).toBe('PLACED');
  });

  test('UC09-T06 test_does_not_combine_ACCEPTED_only_orders', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: orders already past PLACED — not eligible for combine.
    const order1 = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'ACCEPTED',
      deliveryAddress: raleighAddress(),
    });
    const order2 = await createSeededOrder({
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
    expect(res.body.message).toBeDefined();
    expect(res.body.message).toMatch(/don't have any active orders|only.*PLACED|accepted/i);
    
    // Verify orders were not modified — should remain ACCEPTED
    const dbOrder1 = await Order.findById(order1._id);
    const dbOrder2 = await Order.findById(order2._id);
    expect(dbOrder1.status).toBe('ACCEPTED');
    expect(dbOrder2.status).toBe('ACCEPTED');
  });
});
