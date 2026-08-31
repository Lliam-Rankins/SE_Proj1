/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC10 Bid on a cancelled order; UC11 Accept a bid
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import {
  seedMarketplaceActors,
  createSeededOrder,
  raleighAddress,
  Bid,
  Order,
  User,
} from '../helpers/fixtures.mjs';
import { newAgent, registerCustomer } from '../helpers/auth.mjs';

setupProject1aDb();

/** Shared bid payload for UC10/UC11 — neighbor offers to claim cancelled order. */
const placeBidPayload = (orderId) => ({
  orderId,
  bidAmount: 8,
  message: 'Please',
  deliveryAddress: raleighAddress({ street: '200 Bid St' }),
  paymentMethod: 'card',
});

describe('UC10 Bid on a cancelled order', () => {
  test('UC10-T01 test_lists_cancelled_unclaimed_orders', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    // Act: browse pool of cancelled orders open for bids.
    const res = await ctx.neighborAgent.get('/api/bids/cancelled-orders');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((o) => String(o._id) === String(order._id))).toBe(
      true
    );
  });

  test('UC10-T02 test_customer_places_pending_bid_with_expiry', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    // Act: neighbor places bid.
    const res = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    // Assert: PENDING status and future expiresAt timestamp.
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(
      Date.now()
    );
  });

  test('UC10-T03 test_rejects_bid_on_non_cancelled_order', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'PLACED',
    });
    const res = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not cancelled/i);
  });

  test('UC10-T04 test_rejects_bid_by_original_customer', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    // Act: original canceller cannot bid on own order.
    const res = await ctx.customerAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own cancelled order/i);
  });

  test('UC10-T05 test_rejects_duplicate_pending_bid_same_bidder', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    await ctx.neighborAgent.post('/api/bids').send(placeBidPayload(order._id));
    // Act: second bid from same neighbor.
    const res = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already have a pending bid/i);
  });

  test('UC10-T06 test_rejects_bid_from_non_customer_role', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    // Act: driver (not customer) attempts bid.
    const res = await ctx.driverAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    expect(res.status).toBe(403);
  });

  test('UC10-T07 test_bidder_cancels_own_pending_bid', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    const placed = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    const bidId = placed.body.data._id;
    // Act: DELETE own bid.
    const res = await ctx.neighborAgent.delete(`/api/bids/${bidId}`);
    expect(res.status).toBe(200);
    const bid = await Bid.findById(bidId);
    expect(bid.status).toBe('REJECTED');
  });

  test('UC10-T08 test_rejects_negative_or_missing_bidAmount', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    const res = await ctx.neighborAgent.post('/api/bids').send({
      orderId: order._id,
      bidAmount: -1,
      deliveryAddress: raleighAddress(),
      paymentMethod: 'card',
    });
    expect(res.status).toBe(400);
  });
});

describe('UC11 Accept a bid', () => {
  test('UC11-T01 test_accepts_bid_transfers_order_and_rejects_others', async () => {
    const ctx = await seedMarketplaceActors();
    const thirdAgent = newAgent();
    const { user: third } = await registerCustomer(thirdAgent, {
      name: 'Carol',
      email: `carol.${Date.now()}@p1a.test`,
    });
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
      extras: { total: 20 },
    });
    // Arrange: two competing bids ($10 and $9).
    const bid1 = await ctx.neighborAgent
      .post('/api/bids')
      .send({ ...placeBidPayload(order._id), bidAmount: 10 });
    const bid2 = await thirdAgent
      .post('/api/bids')
      .send({ ...placeBidPayload(order._id), bidAmount: 9 });

    // Act: original customer accepts higher bid.
    const res = await ctx.customerAgent
      .post(`/api/bids/${bid1.body.data._id}/accept`)
      .send({});
    expect(res.status).toBe(200);

    // Assert: order transferred to winning bidder, total = bid amount, loser rejected.
    const updated = await Order.findById(order._id);
    expect(String(updated.customerId)).toBe(String(ctx.neighbor._id));
    expect(updated.status).toBe('PLACED');
    expect(updated.total).toBe(10);
    expect(String(updated.claimedBy)).toBe(String(ctx.neighbor._id));

    const other = await Bid.findById(bid2.body.data._id);
    expect(other.status).toBe('REJECTED');
  });

  test('UC11-T02 test_awards_30_points_to_original_customer', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    const bid = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    const before = (await User.findById(ctx.customer._id)).rewardPoints || 0;
    await ctx.customerAgent
      .post(`/api/bids/${bid.body.data._id}/accept`)
      .send({});
    const after = (await User.findById(ctx.customer._id)).rewardPoints;
    expect(after - before).toBe(30);
  });

  test('UC11-T03 test_rejects_accept_by_non_owner', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    const bid = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    // Act: bidder tries to accept own bid — only original customer may.
    const res = await ctx.neighborAgent
      .post(`/api/bids/${bid.body.data._id}/accept`)
      .send({});
    expect(res.status).toBe(403);
  });

  test('UC11-T04 test_rejects_accept_of_expired_bid', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    // Arrange: bid inserted directly with past expiresAt.
    const bid = await Bid.create({
      orderId: order._id,
      bidderId: ctx.neighbor._id,
      bidAmount: 5,
      deliveryAddress: raleighAddress(),
      paymentMethod: 'card',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 60_000),
    });
    const res = await ctx.customerAgent
      .post(`/api/bids/${bid._id}/accept`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('UC11-T05 test_reject_single_bid_leaves_order_cancelled', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    const bid = await ctx.neighborAgent
      .post('/api/bids')
      .send(placeBidPayload(order._id));
    // Act: owner rejects bid instead of accepting.
    const res = await ctx.customerAgent
      .post(`/api/bids/${bid.body.data._id}/reject`)
      .send({});
    expect(res.status).toBe(200);
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('CANCELLED');
    const updatedBid = await Bid.findById(bid.body.data._id);
    expect(updatedBid.status).toBe('REJECTED');
  });

  test('UC11-T06 test_original_customer_lists_bids_sorted_by_amount', async () => {
    const ctx = await seedMarketplaceActors();
    const order = await createSeededOrder({
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItem: ctx.menuItem,
      status: 'CANCELLED',
    });
    await ctx.neighborAgent
      .post('/api/bids')
      .send({ ...placeBidPayload(order._id), bidAmount: 6 });
    const third = newAgent();
    await registerCustomer(third, { email: `third.${Date.now()}@p1a.test` });
    await third
      .post('/api/bids')
      .send({ ...placeBidPayload(order._id), bidAmount: 11 });
    // Act: owner lists bids for order — highest amount first.
    const res = await ctx.customerAgent.get(`/api/bids/order/${order._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].bidAmount).toBeGreaterThanOrEqual(
      res.body.data[1].bidAmount
    );
  });
});
