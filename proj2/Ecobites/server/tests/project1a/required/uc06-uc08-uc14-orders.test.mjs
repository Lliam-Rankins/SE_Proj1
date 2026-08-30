/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC6 Place order; UC7 Track delivery; UC8 Cancel an order; UC14 Choose sustainable packaging
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  placeOrderViaApi,
  createSeededOrder,
  raleighAddress,
  MenuItem,
  Order,
  User,
} from '../helpers/fixtures.mjs';
import { newAgent, registerCustomer, registerRestaurant } from '../helpers/auth.mjs';

setupProject1aDb();

describe('UC06 Place order', () => {
  test('UC06-T01 test_place_order_creates_order_with_status_PLACED', async () => {
    // Arrange: full marketplace (customer, restaurant, menu item).
    const ctx = await seedMarketplaceActors();
    // Act: place order via HTTP (exercises createOrder).
    const res = await placeOrderViaApi(ctx.customerAgent, {
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItemId: ctx.menuItem._id,
      packagingPreference: 'reusable',
    });
    // Assert: PLACED status, reusable packaging points, zero fees/tax.
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PLACED');
    expect(res.body.ecoRewardPoints).toBe(30);
    expect(res.body.deliveryFee).toBe(0);
    expect(res.body.tax).toBe(0);
    expect(res.body.total).toBe(res.body.subtotal);
  }, 20000);

  test('UC06-T02 test_rejects_empty_items', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: POST order with empty items array.
    const res = await ctx.customerAgent.post('/api/orders').send({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      items: [],
      deliveryAddress: raleighAddress(),
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no items/i);
  });

  test('UC06-T03 test_rejects_invalid_menu_item_ids', async () => {
    const ctx = await seedMarketplaceActors();
    const fakeId = '507f1f77bcf86cd799439011';
    // Act: order references non-existent menu item.
    const res = await ctx.customerAgent.post('/api/orders').send({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      items: [{ menuItemId: fakeId, quantity: 1 }],
      deliveryAddress: raleighAddress(),
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  }, 20000);

  test('UC06-T04 test_rejects_mixed_restaurant_items', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: second restaurant with its own menu item.
    const other = await registerRestaurant(newAgent(), {
      email: `other.${Date.now()}@p1a.test`,
      restaurantName: 'Other Place',
    });
    const otherItem = await MenuItem.create({
      restaurantId: other.user._id,
      name: 'Other Dish',
      price: 9,
      isAvailable: true,
    });
    // Act: cart mixes items from two restaurants.
    const res = await ctx.customerAgent.post('/api/orders').send({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      items: [
        { menuItemId: ctx.menuItem._id, quantity: 1 },
        { menuItemId: otherItem._id, quantity: 1 },
      ],
      deliveryAddress: raleighAddress(),
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/same restaurant/i);
  }, 20000);

  test('UC06-T05 test_rejects_non_customer_creating_order', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: restaurant agent tries to place order as if it were a customer.
    const res = await ctx.restaurantAgent.post('/api/orders').send({
      customerId: ctx.restaurant._id,
      restaurantId: ctx.restaurant._id,
      items: [{ menuItemId: ctx.menuItem._id, quantity: 1 }],
      deliveryAddress: raleighAddress(),
    });
    expect(res.status).toBe(403);
  });

  test('UC06-T06 test_unknown_packaging_defaults_to_standard_with_zero_points', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: unknown packaging string should fall back to standard.
    const res = await placeOrderViaApi(ctx.customerAgent, {
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItemId: ctx.menuItem._id,
      packagingPreference: 'plastic-wrap',
    });
    expect(res.status).toBe(201);
    expect(res.body.packagingPreference).toBe('standard');
    expect(res.body.ecoRewardPoints).toBe(0);
  }, 20000);

  test('UC06-T07 test_seasonal_items_add_seasonalRewardPoints_to_ecoRewardPoints', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: mark menu item seasonal with +5 bonus points.
    await MenuItem.findByIdAndUpdate(ctx.menuItem._id, {
      isSeasonal: true,
      seasonalRewardPoints: 5,
    });
    // Act: place order with reusable (+30) packaging.
    const res = await placeOrderViaApi(ctx.customerAgent, {
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItemId: ctx.menuItem._id,
      packagingPreference: 'reusable',
    });
    // Assert: 30 packaging + 5 seasonal = 35.
    expect(res.status).toBe(201);
    expect(res.body.ecoRewardPoints).toBe(35);
  }, 20000);
});

describe('UC07 Track delivery', () => {
  test('UC07-T01 test_customer_lists_own_orders_via_get_orders_by_role', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: one PLACED order for customer.
    await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: customer fetches their order list.
    const res = await ctx.customerAgent.get(
      `/api/orders/customer/${ctx.customer._id}`
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('PLACED');
  });

  test('UC07-T02 test_customer_cannot_list_another_users_orders', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: Alice tries to list Bob's orders.
    const res = await ctx.customerAgent.get(
      `/api/orders/customer/${ctx.neighbor._id}`
    );
    expect(res.status).toBe(403);
  });

  test('UC07-T03 test_get_order_detail_returns_status_and_history', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: fetch single order detail.
    const res = await ctx.customerAgent.get(`/api/orders/detail/${order._id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PLACED');
    expect(Array.isArray(res.body.statusHistory)).toBe(true);
  });

  test('UC07-T04 test_get_order_detail_returns_404_for_unknown_id', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: valid ObjectId format but no matching order.
    const res = await ctx.customerAgent.get(
      '/api/orders/detail/507f1f77bcf86cd799439011'
    );
    expect(res.status).toBe(404);
  });

  test('UC07-T05 test_combined_order_shows_combineGroupId_in_detail', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: order already in COMBINED state with group id.
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'COMBINED',
      extras: { combineGroupId: 'GRPTEST1' },
    });
    const res = await ctx.customerAgent.get(`/api/orders/detail/${order._id}`);
    expect(res.status).toBe(200);
    expect(res.body.combineGroupId).toBe('GRPTEST1');
    expect(res.body.status).toBe('COMBINED');
  });
});

describe('UC08 Cancel an order', () => {
  test('UC08-T01 test_customer_cancels_own_placed_order', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: customer patches status to CANCELLED.
    const res = await ctx.customerAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  test('UC08-T02 test_restaurant_cannot_cancel_order', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: restaurant tries to cancel — only customer may cancel.
    const res = await ctx.restaurantAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only customer can cancel/i);
  });

  test('UC08-T03 test_non_owner_cannot_cancel', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: neighbor (not order owner) attempts cancel.
    const res = await ctx.neighborAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(403);
  });

  test('UC08-T04 test_cancelled_unclaimed_order_appears_in_bid_list', async () => {
    const ctx = await seedMarketplaceActors();
    // Arrange: order already cancelled in DB.
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    // Act: neighbor browses cancelled orders available for bidding.
    const res = await ctx.neighborAgent.get('/api/bids/cancelled-orders');
    expect(res.status).toBe(200);
    expect(res.body.data.some((o) => String(o._id) === String(order._id))).toBe(
      true
    );
  });
});

describe('UC14 Choose sustainable packaging', () => {
  test('UC14-T01 test_update_preferences_saves_reusable_packaging', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: persist default packaging preference on profile.
    const res = await ctx.customerAgent
      .post('/api/profile/preferences')
      .send({ packaging: 'reusable' });
    expect(res.status).toBe(200);
    expect(res.body.preferences.packaging).toBe('reusable');
  });

  test('UC14-T02 test_rejects_invalid_packaging_preference', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent
      .post('/api/profile/preferences')
      .send({ packaging: 'styrofoam' });
    expect(res.status).toBe(400);
  });

  test('UC14-T03 test_place_order_persists_packaging_and_ecoRewardPoints', async () => {
    const ctx = await seedMarketplaceActors();
    // Act: place order with compostable packaging (+20 points).
    const res = await placeOrderViaApi(ctx.customerAgent, {
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItemId: ctx.menuItem._id,
      packagingPreference: 'compostable',
    });
    expect(res.status).toBe(201);
    expect(res.body.packagingPreference).toBe('compostable');
    expect(res.body.ecoRewardPoints).toBe(20);
  }, 20000);
});
