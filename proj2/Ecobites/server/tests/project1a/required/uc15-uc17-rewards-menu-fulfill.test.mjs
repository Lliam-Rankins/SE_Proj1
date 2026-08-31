/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC15 Redeem eco-rewards; UC16 Manage the menu; UC17 Fulfill order
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  createSeededOrder,
  nearbyAddress,
  raleighAddress,
  User,
} from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('UC15 Redeem eco-rewards', () => {
  test('UC15-T01 test_adding_100_points_mints_one_five_dollar_reward', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: admin-style endpoint adds 100 points — should mint $5 reward.
    const res = await ctx.customerAgent
      .patch(`/api/profile/users/${ctx.customer._id}/points`)
      .send({ points: 100 });
    expect(res.status).toBe(200);
    expect(res.body.rewardsIssued).toBe(1);
    expect(res.body.rewardPoints).toBe(0);
    expect(res.body.rewards).toHaveLength(1);
    expect(res.body.rewards[0].amount).toBe(5);
    expect(res.body.rewards[0].used).toBe(false);
  });

  test('UC15-T02 test_mark_reward_used_sets_used_true', async () => {
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent
      .patch(`/api/profile/users/${ctx.customer._id}/points`)
      .send({ points: 100 });
    const user = await User.findById(ctx.customer._id);
    const rewardId = user.rewardHistory[0]._id;
    // Act: mark first minted reward as used.
    const res = await ctx.customerAgent.patch(
      `/api/profile/users/${ctx.customer._id}/rewards/${rewardId}/use`
    );
    expect(res.status).toBe(200);
    expect(res.body.reward.used).toBe(true);
  });

  test('UC15-T03 test_rejects_mark_already_used_reward', async () => {
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent
      .patch(`/api/profile/users/${ctx.customer._id}/points`)
      .send({ points: 100 });
    const user = await User.findById(ctx.customer._id);
    const rewardId = user.rewardHistory[0]._id;
    await ctx.customerAgent.patch(
      `/api/profile/users/${ctx.customer._id}/rewards/${rewardId}/use`
    );
    // Act: double-use attempt.
    const res = await ctx.customerAgent.patch(
      `/api/profile/users/${ctx.customer._id}/rewards/${rewardId}/use`
    );
    expect(res.status).toBe(400);
  });

  test('UC15-T04 test_reward_redemption_does_not_change_order_total_on_server', async () => {
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent
      .patch(`/api/profile/users/${ctx.customer._id}/points`)
      .send({ points: 100 });
    const user = await User.findById(ctx.customer._id);
    const rewardId = user.rewardHistory[0]._id;
    await ctx.customerAgent.patch(
      `/api/profile/users/${ctx.customer._id}/rewards/${rewardId}/use`
    );
    // Act: client sends discounted total — server createOrder ignores discounts.
    const orderRes = await ctx.customerAgent.post('/api/orders').send({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      items: [{ menuItemId: ctx.menuItem._id, quantity: 1 }],
      packagingPreference: 'standard',
      deliveryAddress: raleighAddress(),
      total: ctx.menuItem.price - 5,
    });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.total).toBe(ctx.menuItem.price);
  }, 20000);
});

describe('UC16 Manage the menu', () => {
  test('UC16-T01 test_restaurant_creates_menu_item_under_own_id', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: restaurant POSTs new menu item (restaurantId inferred from auth).
    const res = await ctx.restaurantAgent.post('/api/menu').send({
      name: 'New Salad',
      price: 9.5,
      category: 'side',
      description: 'Fresh',
    });
    expect(res.status).toBe(201);
    expect(String(res.body.restaurantId)).toBe(String(ctx.restaurant._id));
    expect(res.body.name).toBe('New Salad');
  });

  test('UC16-T02 test_non_restaurant_cannot_create_menu_item', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post('/api/menu').send({
      name: 'Hacker Dish',
      price: 1,
    });
    expect(res.status).toBe(403);
  });

  test('UC16-T03 test_restaurant_cannot_add_item_to_other_restaurant', async () => {
    const ctx = await seedMarketplaceActors();
    const { registerRestaurant, newAgent } = await import('../helpers/auth.mjs');
    const other = newAgent();
    const { user: otherR } = await registerRestaurant(other, {
      email: `othermen.${Date.now()}@p1a.test`,
    });
    // Act: try to set restaurantId to another owner's id.
    const res = await ctx.restaurantAgent.post('/api/menu').send({
      restaurantId: otherR._id,
      name: 'Stolen',
      price: 3,
    });
    expect(res.status).toBe(403);
  });

  test('UC16-T04 test_restaurant_updates_and_deletes_own_menu_item', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.restaurantAgent.post('/api/menu').send({
      name: 'Temp Item',
      price: 4,
    });
    const id = created.body._id;
    // Act: PUT rename, then DELETE.
    const updated = await ctx.restaurantAgent
      .put(`/api/menu/${id}`)
      .send({ name: 'Renamed', price: 5 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Renamed');
    const deleted = await ctx.restaurantAgent.delete(`/api/menu/${id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.success).toBe(true);
  });

  test('UC16-T05 test_create_seasonal_item_with_bonus_points', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.restaurantAgent.post('/api/menu').send({
      name: 'Pumpkin Soup',
      price: 8,
      isSeasonal: true,
      seasonalLabel: 'Fall',
      seasonalRewardPoints: 7,
    });
    expect(res.status).toBe(201);
    expect(res.body.isSeasonal).toBe(true);
    expect(res.body.seasonalRewardPoints).toBe(7);
  });

  test('UC16-T06 test_deleted_item_causes_place_order_to_fail', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.restaurantAgent.post('/api/menu').send({
      name: 'Gone Soon',
      price: 6,
    });
    const id = created.body._id;
    await ctx.restaurantAgent.delete(`/api/menu/${id}`);
    // Act: customer tries to order deleted item.
    const res = await ctx.customerAgent.post('/api/orders').send({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      items: [{ menuItemId: id, quantity: 1 }],
      deliveryAddress: raleighAddress(),
    });
    expect(res.status).toBe(400);
  }, 20000);
});

describe('UC17 Fulfill order', () => {
  test('UC17-T01 test_restaurant_lists_incoming_orders', async () => {
    const ctx = await seedMarketplaceActors();
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: restaurant views orders for their id.
    const res = await ctx.restaurantAgent.get(
      `/api/orders/restaurant/${ctx.restaurant._id}`
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('UC17-T02 test_restaurant_marks_order_preparing_then_ready', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: PLACED → PREPARING → READY status progression.
    const prep = await ctx.restaurantAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'PREPARING' });
    expect(prep.status).toBe(200);
    expect(prep.body.status).toBe('PREPARING');
    const ready = await ctx.restaurantAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'READY' });
    expect(ready.status).toBe(200);
    expect(ready.body.status).toBe('READY');
  });

  test('UC17-T03 test_restaurant_cannot_set_CANCELLED', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    const res = await ctx.restaurantAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(403);
  });

  test('UC17-T04 test_combined_order_visible_to_drivers_without_READY_status', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: COMBINED order (not yet READY) with group id.
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'COMBINED',
      extras: { combineGroupId: 'GRPABC' },
    });
    // Act: driver polls available jobs — COMBINED should appear.
    const res = await ctx.driverAgent.get('/api/orders/available/drivers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('COMBINED');
    expect(res.body[0].combineGroupId).toBe('GRPABC');
  });
});
