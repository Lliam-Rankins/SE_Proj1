/**
 * Finding test: verify createOrder persists paymentMethod on the saved order
 * Expectation (per D2): paymentMethod should NOT be charged nor stored on the order.
 * This test asserts the opposite (that paymentMethod is stored) to demonstrate the gap
 * between D2 expectation and implementation. If the code does NOT store paymentMethod,
 * this test will FAIL — that is an explicit finding to report.
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import { seedMarketplaceActors, placeOrderViaApi, Order } from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('FINDING UC06 payment storage', () => {
  test('UC06-F01 test_order_contains_paymentMethod_after_place', async () => {
    const ctx = await seedMarketplaceActors();
    const res = await placeOrderViaApi(ctx.customerAgent, {
      customerId: ctx.customer._id,
      restaurantId: ctx.restaurant._id,
      menuItemId: ctx.menuItem._id,
      packagingPreference: 'reusable',
      extras: { paymentMethod: 'card' }
    });

    // Ensure HTTP call succeeded
    expect(res.status).toBe(201);

    // Fetch the saved order from DB and assert paymentMethod exists
    const orderId = res.body._id;
    const saved = await Order.findById(orderId).lean();
    // This assertion reflects a D2 expectation that the server should have stored payment method.
    // The actual code does NOT set paymentMethod on the Order model; therefore this assertion is
    // expected to FAIL and should be recorded as an explicit finding.
    expect(saved.paymentMethod).toBeDefined();
  });
});
