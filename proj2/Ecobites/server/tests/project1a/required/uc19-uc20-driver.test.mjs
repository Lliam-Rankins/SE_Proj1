/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC19 Accept a delivery job; UC20 Deliver order
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  createSeededOrder,
  nearbyAddress,
  raleighAddress,
  Order,
  User,
} from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('UC19 Accept a delivery job', () => {
  test('UC19-T01 test_driver_lists_available_ready_and_combined_orders', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: one READY and one COMBINED order.
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'READY',
    });
    await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'COMBINED',
      deliveryAddress: nearbyAddress(),
      extras: { combineGroupId: 'GRP1' },
    });
    const res = await ctx.driverAgent.get('/api/orders/available/drivers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.some((o) => o.status === 'READY')).toBe(true);
    expect(res.body.some((o) => o.status === 'COMBINED')).toBe(true);
  });

  test('UC19-T02 test_non_driver_cannot_access_available_list', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.get('/api/orders/available/drivers');
    expect(res.status).toBe(403);
  });

  test('UC19-T03 test_driver_assigns_self_to_order', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'READY',
    });
    // Act: driver claims job via DRIVER_ASSIGNED status + driverId.
    const res = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DRIVER_ASSIGNED', driverId: ctx.driver._id });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DRIVER_ASSIGNED');
    expect(String(res.body.driverId)).toBe(String(ctx.driver._id));
  });

  test('UC19-T04 test_driver_cannot_assign_without_driver_role', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'READY',
    });
    const res = await ctx.customerAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DRIVER_ASSIGNED', driverId: ctx.customer._id });
    expect(res.status).toBe(403);
  });

  test('UC19-T05 test_assigning_driver_propagates_to_combine_group', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: two orders sharing combineGroupId GRPXYZ.
    const a = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'COMBINED',
      deliveryAddress: raleighAddress(),
      extras: { combineGroupId: 'GRPXYZ' },
    });
    const b = await createSeededOrder({
      customerId: ctx.neighbor._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'COMBINED',
      deliveryAddress: nearbyAddress(),
      extras: { combineGroupId: 'GRPXYZ' },
    });
    // Act: assign driver on first order only.
    const assignRes = await ctx.driverAgent
      .patch(`/api/orders/${a._id}/status`)
      .send({ status: 'DRIVER_ASSIGNED', driverId: ctx.driver._id });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.status).toBe('DRIVER_ASSIGNED');

    const patched = await Order.findById(a._id);
    const sibling = await Order.findById(b._id);
    for (const order of [patched, sibling]) {
      expect(order.status).toBe('DRIVER_ASSIGNED');
      expect(String(order.driverId)).toBe(String(ctx.driver._id));
    }
  });

  test('UC19-T06 test_assigned_order_removed_from_available_list', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'READY',
    });
    await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DRIVER_ASSIGNED', driverId: ctx.driver._id });
    // Act: re-fetch available list — claimed order should be gone.
    const res = await ctx.driverAgent.get('/api/orders/available/drivers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('UC20 Deliver order', () => {
  test('UC20-T01 test_driver_marks_picked_up_out_for_delivery_delivered', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      ecoRewardPoints: 30,
      extras: { driverId: ctx.driver._id },
    });
    // Act: full delivery lifecycle PICKED_UP → OUT_FOR_DELIVERY → DELIVERED.
    await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'PICKED_UP' });
    await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    const res = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELIVERED');
  });

  test('UC20-T02 test_delivery_credits_customer_ecoRewardPoints_once', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      ecoRewardPoints: 30,
      extras: { driverId: ctx.driver._id },
    });
    const before = (await User.findById(ctx.customer._id)).rewardPoints || 0;
    const first = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(first.status).toBe(200);
    const mid = (await User.findById(ctx.customer._id)).rewardPoints;
    expect(mid - before).toBe(30);
    // Simulate re-delivery attempt after ecoRewardCredited already true.
    await Order.findByIdAndUpdate(order._id, {
      status: 'OUT_FOR_DELIVERY',
      ecoRewardCredited: true,
    });
    const second = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(second.status).toBe(200);
    const after = (await User.findById(ctx.customer._id)).rewardPoints;
    expect(after).toBe(mid);
  });

  test('UC20-T03 test_delivery_skips_credit_when_ecoRewardPoints_zero', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      packagingPreference: 'standard',
      ecoRewardPoints: 0,
      extras: { driverId: ctx.driver._id },
    });
    const before = (await User.findById(ctx.customer._id)).rewardPoints || 0;
    const res = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(200);
    const after = (await User.findById(ctx.customer._id)).rewardPoints || 0;
    expect(after).toBe(before);
  });

  test('UC20-T04 test_delivery_credits_driver_incentive_for_EV', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      ecoRewardPoints: 0,
      extras: { driverId: ctx.driver._id },
    });
    const before = (await User.findById(ctx.driver._id)).rewardPoints || 0;
    const res = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.body.driverRewardPoints).toBe(25);
    const after = (await User.findById(ctx.driver._id)).rewardPoints;
    expect(after - before).toBe(25);
  });

  test('UC20-T05 test_driver_car_vehicle_gets_five_points', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: Car vehicle gets DEFAULT incentive (5 pts).
    await User.findByIdAndUpdate(ctx.driver._id, { vehicleType: 'Car' });
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      ecoRewardPoints: 0,
      extras: { driverId: ctx.driver._id },
    });
    const before = (await User.findById(ctx.driver._id)).rewardPoints || 0;
    const res = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(200);
    expect(res.body.driverRewardPoints).toBe(5);
    const after = (await User.findById(ctx.driver._id)).rewardPoints;
    expect(after - before).toBe(5);
  });

  test('UC20-T06 test_non_driver_cannot_mark_delivery_statuses', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      extras: { driverId: ctx.driver._id },
    });
    const res = await ctx.customerAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(403);
  });
});
