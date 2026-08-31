/**
 * Deliverable: D3 (honest failures for the results table / demo)
 * Use cases: UC6, UC7, UC8, UC12, UC15, UC17, UC20 extensions that the product does not meet
 * Assignment: "Expect some failures... A failing test on a real fault is a finding"
 * These assert D2 requirements; FAIL against unmodified code is the evidence — do not patch production.
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  createSeededOrder,
  placeOrderViaApi,
  nearbyAddress,
  raleighAddress,
  Order,
  User,
} from '../helpers/fixtures.mjs';
import { newAgent, registerCustomer } from '../helpers/auth.mjs';

setupProject1aDb();

describe('Project 1a requirement findings (expected FAIL)', () => {
  test('FIND-UC07 test_order_detail_refuses_non_owner_access', async () => {
    // UC7 ext 4b: viewing by id should enforce ownership. Product does not.
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
    });
    // Act: neighbor fetches Alice's order detail — should be 403 per D2.
    const res = await ctx.neighborAgent.get(`/api/orders/detail/${order._id}`);
    expect(res.status).toBe(403);
  });

  test('FIND-UC08 test_customer_cannot_cancel_after_DELIVERED', async () => {
    // UC8 ext 2b: cancel should be blocked after delivery. Product allows it.
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DELIVERED',
    });
    const res = await ctx.customerAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(400);
  });

  test('FIND-UC06 test_paymentMethod_is_persisted_on_created_order', async () => {
    // UC6 ext 4b: payment details collected should be stored. createOrder ignores them.
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post('/api/orders').send({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      items: [{ menuItemId: ctx.menuItem._id, quantity: 1 }],
      packagingPreference: 'standard',
      deliveryAddress: raleighAddress(),
      paymentMethod: 'cash',
    });
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('cash');
  }, 20000);

  test('FIND-UC12 test_createReview_stats_match_stored_averageRating', async () => {
    // UC12 ext 3d: createReview response stats should match stored aggregates.
    // Controller reads restaurantInfo.* which does not exist on User.
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
      comment: 'Excellent',
    });
    expect(res.status).toBe(201);
    const stored = await User.findById(ctx.restaurant._id);
    expect(stored.averageRating).toBe(5);
    expect(stored.totalReviews).toBe(1);
    // Finding: API stats object does not mirror DB aggregate.
    expect(res.body.stats.averageRating).toBe(5);
    expect(res.body.stats.totalReviews).toBe(1);
  });

  test('FIND-UC12 test_getReviewsByRestaurant_stats_match_stored_averageRating', async () => {
    // UC12 ext 3d: list-by-restaurant stats should match stored aggregates.
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
      comment: 'Excellent',
    });
    const res = await ctx.customerAgent.get(
      `/api/reviews/restaurant/${ctx.restaurant._id}`
    );
    expect(res.status).toBe(200);
    const stored = await User.findById(ctx.restaurant._id);
    expect(stored.averageRating).toBe(5);
    expect(stored.totalReviews).toBe(1);
    expect(res.body.stats.averageRating).toBe(5);
    expect(res.body.stats.totalReviews).toBe(1);
  });

  test('FIND-UC12 test_updateReview_stats_match_stored_averageRating', async () => {
    // UC12 ext 3d: updateReview response stats should match stored aggregates.
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 3,
    });
    const res = await ctx.customerAgent
      .put(`/api/reviews/${created.body.review._id}`)
      .send({ rating: 5, comment: 'Updated' });
    expect(res.status).toBe(200);
    const stored = await User.findById(ctx.restaurant._id);
    expect(stored.averageRating).toBe(5);
    expect(stored.totalReviews).toBe(1);
    expect(res.body.stats.averageRating).toBe(5);
    expect(res.body.stats.totalReviews).toBe(1);
  });

  test('FIND-UC12 test_deleteReview_stats_match_stored_averageRating', async () => {
    // UC12 ext 3d: deleteReview response stats should match stored aggregates.
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
    });
    await ctx.neighborAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 3,
    });
    const res = await ctx.customerAgent.delete(
      `/api/reviews/${created.body.review._id}`
    );
    expect(res.status).toBe(200);
    const stored = await User.findById(ctx.restaurant._id);
    expect(stored.averageRating).toBe(3);
    expect(stored.totalReviews).toBe(1);
    expect(res.body.stats.averageRating).toBe(3);
    expect(res.body.stats.totalReviews).toBe(1);
  });

  test('FIND-UC12 test_getMyReviews_populates_restaurant_cuisine', async () => {
    // getMyReviews populate uses restaurantInfo.cuisine; User stores cuisine at top level.
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 4,
    });
    const res = await ctx.customerAgent.get('/api/reviews/my-reviews');
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].restaurantId.cuisine).toEqual(['Vegan']);
  });

  test('FIND-UC15 test_combine_points_mint_five_dollar_reward_at_100', async () => {
    // UC15 ext 1c: combine +20 should eventually mint $5 via updateRewardPoints path.
    // Product increments rewardPoints directly and never mints rewardHistory.
    const ctx = await seedMarketplaceActors();
    await User.findByIdAndUpdate(ctx.customer._id, { rewardPoints: 90 });
    await User.findByIdAndUpdate(ctx.neighbor._id, { rewardPoints: 0 });
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
    await ctx.customerAgent.post('/api/orders/combine').send({
      customerId: ctx.customer._id,
    });
    const user = await User.findById(ctx.customer._id);
    // 90 + 20 = 110 → should mint one $5 and leave remainder 10 if minting worked.
    expect(user.rewardHistory.length).toBeGreaterThanOrEqual(1);
    expect(user.rewardPoints).toBe(10);
  });

  test('FIND-UC17 test_restaurant_cannot_mark_ready_directly_from_PLACED', async () => {
    // UC17 ext 2d: status sequence should be enforced. Product allows jump to READY.
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'PLACED',
    });
    const res = await ctx.restaurantAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'READY' });
    expect(res.status).toBe(400);
  });

  test('FIND-UC20 test_driver_cannot_mark_delivered_without_prior_pickup', async () => {
    // UC20 ext 1b: delivery sequence should be enforced.
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'DRIVER_ASSIGNED',
      extras: { driverId: ctx.driver._id },
    });
    const res = await ctx.driverAgent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(400);
  });

  test('FIND-UC15 test_mark_reward_used_requires_ownership', async () => {
    // Rewards should only be usable by their owner. Product has no ownership check.
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent
      .patch(`/api/profile/users/${ctx.customer._id}/points`)
      .send({ points: 100 });
    const user = await User.findById(ctx.customer._id);
    const rewardId = user.rewardHistory[0]._id;
    // Act: neighbor tries to spend Alice's reward.
    const res = await ctx.neighborAgent.patch(
      `/api/profile/users/${ctx.customer._id}/rewards/${rewardId}/use`
    );
    expect(res.status).toBe(403);
  });

  test('FIND-UC17 test_restaurant_timeout_auto_cancels_silent_order', async () => {
    // UC17 ext 2c / course UC3 2b: silent restaurant should auto-cancel.
    // Product has no timer — order stays PLACED forever.
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'PLACED',
    });
    // Simulate "N minutes later" with no restaurant action.
    await new Promise((r) => setTimeout(r, 50));
    const still = await Order.findById(order._id);
    expect(still.status).toBe('CANCELLED');
  });
});
