/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC12 Rate the restaurant; UC13 Mark a review helpful; UC18 Respond to a review
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  createSeededOrder,
  Review,
  User,
} from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('UC12 Rate the restaurant', () => {
  test('UC12-T01 test_customer_creates_review_and_updates_stored_averageRating', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
      comment: 'Great eco packaging',
    });
    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);
    const restaurant = await User.findById(ctx.restaurant._id);
    expect(restaurant.averageRating).toBe(5);
    expect(restaurant.totalReviews).toBe(1);
  });

  test('UC12-T02 test_rejects_rating_outside_1_to_5', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 6,
    });
    expect(res.status).toBe(400);
  });

  test('UC12-T03 test_rejects_duplicate_review_same_restaurant', async () => {
    const ctx = await seedMarketplaceActors();
    await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 4,
    });
    const res = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });

  test('UC12-T04 test_allows_review_without_orderId_unverified', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 3,
    });
    expect(res.status).toBe(201);
    expect(res.body.review.verified).toBeFalsy();
  });

  test('UC12-T05 test_rejects_review_when_orderId_not_delivered', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'PLACED',
    });
    const res = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      orderId: order._id,
      rating: 4,
    });
    expect(res.status).toBe(403);
  });

  test('UC12-T06 test_customer_updates_own_review', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 3,
    });
    const res = await ctx.customerAgent
      .put(`/api/reviews/${created.body.review._id}`)
      .send({ rating: 5, comment: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.review.rating).toBe(5);
  });
});

describe('UC13 Mark a review helpful', () => {
  test('UC13-T01 test_mark_helpful_increments_count', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
    });
    const res = await ctx.neighborAgent.post(
      `/api/reviews/${created.body.review._id}/helpful`
    );
    expect(res.status).toBe(200);
    expect(res.body.helpfulCount ?? res.body.review?.helpfulCount).toBeTruthy();
  });

  test('UC13-T02 test_second_mark_toggles_off_and_decrements', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 4,
    });
    const id = created.body.review._id;
    await ctx.neighborAgent.post(`/api/reviews/${id}/helpful`);
    const res = await ctx.neighborAgent.post(`/api/reviews/${id}/helpful`);
    expect(res.status).toBe(200);
    const review = await Review.findById(id);
    expect(review.helpfulCount).toBe(0);
  });

  test('UC13-T03 test_mark_helpful_returns_404_for_missing_review', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await ctx.customerAgent.post(
      '/api/reviews/507f1f77bcf86cd799439011/helpful'
    );
    expect(res.status).toBe(404);
  });

  test('UC13-T04 test_author_can_mark_own_review_helpful', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
    });
    const res = await ctx.customerAgent.post(
      `/api/reviews/${created.body.review._id}/helpful`
    );
    expect(res.status).toBe(200);
  });
});

describe('UC18 Respond to a review', () => {
  test('UC18-T01 test_restaurant_posts_response_on_own_review', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 4,
      comment: 'Good',
    });
    const res = await ctx.restaurantAgent
      .post(`/api/reviews/${created.body.review._id}/response`)
      .send({ response: 'Thanks for dining with us!' });
    expect(res.status).toBe(200);
    expect(res.body.response.text).toMatch(/Thanks/);
  });

  test('UC18-T02 test_non_restaurant_cannot_respond', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 3,
    });
    const res = await ctx.customerAgent
      .post(`/api/reviews/${created.body.review._id}/response`)
      .send({ response: 'Nope' });
    expect(res.status).toBe(403);
  });

  test('UC18-T03 test_cannot_respond_to_another_restaurants_review', async () => {
    const ctx = await seedMarketplaceActors();
    const { registerRestaurant, newAgent } = await import('../helpers/auth.mjs');
    const otherAgent = newAgent();
    await registerRestaurant(otherAgent, {
      email: `otherresto.${Date.now()}@p1a.test`,
      restaurantName: 'Other',
    });
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 2,
    });
    const res = await otherAgent
      .post(`/api/reviews/${created.body.review._id}/response`)
      .send({ response: 'Wrong place' });
    expect(res.status).toBe(404);
  });

  test('UC18-T04 test_empty_response_is_still_saved', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
    });
    const res = await ctx.restaurantAgent
      .post(`/api/reviews/${created.body.review._id}/response`)
      .send({ response: '' });
    expect(res.status).toBe(200);
  });

  test('UC18-T05 test_second_response_overwrites_first', async () => {
    const ctx = await seedMarketplaceActors();
    const created = await ctx.customerAgent.post('/api/reviews').send({
      restaurantId: ctx.restaurant._id,
      rating: 5,
    });
    const id = created.body.review._id;
    await ctx.restaurantAgent
      .post(`/api/reviews/${id}/response`)
      .send({ response: 'First' });
    const res = await ctx.restaurantAgent
      .post(`/api/reviews/${id}/response`)
      .send({ response: 'Second' });
    expect(res.status).toBe(200);
    const review = await Review.findById(id);
    expect(review.response.text).toBe('Second');
  });
});
