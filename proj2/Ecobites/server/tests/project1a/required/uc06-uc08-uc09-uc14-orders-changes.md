# Aavritti's changes to AI code

## Files modified

- `proj2/Ecobites/server/tests/project1a/required/uc06-uc08-uc14-orders.test.mjs`
- `proj2/Ecobites/server/tests/project1a/required/uc09-combine.test.mjs`

---

## UC06-T01 — Place order creates a complete placed order

**Why the previous code was weak:** It checked the HTTP status, order status, pricing, and reward points, but not the rest of the created order contract. A response could omit the order ID, customer/restaurant ownership, items, packaging choice, subtotal, or timestamp and still pass.

### Before

```jsx
expect(res.status).toBe(201);
expect(res.body.status).toBe('PLACED');
expect(res.body.ecoRewardPoints).toBe(30);
expect(res.body.deliveryFee).toBe(0);
expect(res.body.tax).toBe(0);
expect(res.body.total).toBe(res.body.subtotal);
```

### After

```jsx
expect(res.status).toBe(201);
expect(res.body._id).toBeDefined();
expect(res.body.status).toBe('PLACED');
expect(res.body.ecoRewardPoints).toBe(30);
expect(res.body.deliveryFee).toBe(0);
expect(res.body.tax).toBe(0);
expect(res.body.total).toBe(res.body.subtotal);
expect(res.body.packagingPreference).toBe('reusable');
expect(res.body.items).toHaveLength(1);
expect(res.body.customerId).toEqual(ctx.customer._id);
expect(res.body.restaurantId).toEqual(ctx.restaurant._id);
expect(res.body.subtotal).toBeGreaterThan(0);
expect(res.body.createdAt).toBeDefined();
```

**Reasoning:** The successful order response should contain a complete, correctly owned order—not merely the expected status and totals.

---

## UC06-T02, T03, T04, and T05 — Rejected order requests leave no order behind

**Why the previous code was incomplete:** Each test asserted only the failing HTTP response. It did not prove that validation or authorization failures prevented database writes. Error-message matching was also overly narrow in several cases.

### After

```jsx
expect(res.body.message).toMatch(/no items|at least one|empty/i);
expect(res.body.message).toBeDefined();
const orderCount = await Order.countDocuments({ customerId: ctx.customer._id });
expect(orderCount).toBe(0);
```

```jsx
expect(res.body.message).toMatch(/invalid|not found|does not exist/i);
const order = await Order.findOne({ customerId: ctx.customer._id });
expect(order).toBeNull();
```

```jsx
expect(res.body.message).toMatch(/same restaurant|single restaurant|one restaurant/i);
const order = await Order.findOne({ customerId: ctx.customer._id });
expect(order).toBeNull();
```

```jsx
expect(res.status).toBe(403);
expect(res.body.message).toBeDefined();
const order = await Order.findOne({ customerId: ctx.restaurant._id });
expect(order).toBeNull();
```

**Reasoning:** These tests now verify the important side effect: invalid carts and unauthorized actors cannot create orders. Broader message patterns accept valid wording changes without weakening the expected failure condition.

---

## UC06-T06 and T07 — Packaging and seasonal rewards persist correctly

**Why the previous code was weak:** The tests only inspected selected response fields. They did not confirm that the server stored the fallback packaging choice or calculated rewards in the persisted order.

### After

```jsx
expect(res.body._id).toBeDefined();
expect(res.body.packagingPreference).toBe('standard');
expect(res.body.ecoRewardPoints).toBe(0);
expect(res.body.status).toBe('PLACED');
const dbOrder = await Order.findById(res.body._id);
expect(dbOrder).not.toBeNull();
expect(dbOrder.packagingPreference).toBe('standard');
expect(dbOrder.ecoRewardPoints).toBe(0);
```

```jsx
expect(res.body.ecoRewardPoints).toBe(35);
expect(res.body.packagingPreference).toBe('reusable');
expect(res.body.status).toBe('PLACED');
expect(res.body._id).toBeDefined();
const dbOrder = await Order.findById(res.body._id);
expect(dbOrder.ecoRewardPoints).toBe(35);
expect(dbOrder.status).toBe('PLACED');
```

**Reasoning:** The tests now verify both the API response and database state for invalid-package fallback and the reusable-plus-seasonal reward calculation.

---

## UC07-T01 — Customer lists own orders

**Why the previous code was incomplete:** It checked only the response length and status. The changed test verifies that the response is an array and that its order belongs to the requesting customer, contains the expected restaurant and item, and has the right status.

### After

```jsx
expect(res.status).toBe(200);
expect(Array.isArray(res.body)).toBe(true);
expect(res.body).toHaveLength(1);
expect(res.body[0].status).toBe('PLACED');
expect(res.body[0].customerId).toEqual(ctx.customer._id);
expect(res.body[0].restaurantId).toEqual(ctx.restaurant._id);
expect(res.body[0].items).toHaveLength(1);
```

**Reasoning:** An exact, isolated setup should return exactly one complete order for the correct customer.

---

## UC07-T02 — Customer cannot list another user's orders

**Why the previous code was weak:** The test made a forbidden request without first seeding an order, so it did not demonstrate protection of real user data. It also did not check that the authorized route still works.

### After

```jsx
await createSeededOrder({
  customerId: ctx.customer._id,
  restaurantId: ctx.restaurant._id,
  menuItem: ctx.menuItem,
});

expect(res.status).toBe(403);
expect(res.body.message).toBeDefined();
const ownRes = await ctx.customerAgent.get(
  `/api/orders/customer/${ctx.customer._id}`
);
expect(ownRes.status).toBe(200);
expect(ownRes.body).toHaveLength(1);
```

**Reasoning:** This confirms both access control (another user's data is forbidden) and the customer's valid access to their own existing order.

---

## UC07-T03, T04, and T05 — Order tracking details

**Why the previous code was incomplete:** Detail tests checked only a few values. They now verify meaningful tracking data: non-empty history, its expected state, order ownership, item data, and clear errors for missing orders. The combined-order test also confirms a `COMBINED` history entry.

### After

```jsx
expect(res.body.statusHistory.length).toBeGreaterThan(0);
expect(res.body.statusHistory[0].status).toBe('PLACED');
expect(res.body.customerId).toEqual(ctx.customer._id);
expect(res.body.restaurantId).toEqual(ctx.restaurant._id);
expect(res.body.items).toHaveLength(1);
```

```jsx
expect(res.status).toBe(404);
expect(res.body.message).toBeDefined();
expect(res.body.message).toMatch(/not found|does not exist|no order/i);
```

```jsx
expect(Array.isArray(res.body.statusHistory)).toBe(true);
expect(res.body.statusHistory.some((sh) => sh.status === 'COMBINED')).toBe(true);
```

**Reasoning:** Tracking is useful only when the returned detail represents the correct order, its history, and its combined-delivery state.

---

## UC08-T01, T02, and T03 — Cancellation state and authorization

**Why the previous code was incomplete:** Successful cancellation was verified only in the response, while rejected cancellations were not checked against the database. An API could return the right status while storing the wrong order state.

### After

```jsx
expect(res.body.status).toBe('CANCELLED');
expect(Array.isArray(res.body.statusHistory)).toBe(true);
expect(res.body.statusHistory.length).toBeGreaterThanOrEqual(2);
expect(res.body.statusHistory[res.body.statusHistory.length - 1].status).toBe('CANCELLED');
const dbOrder = await Order.findById(order._id);
expect(dbOrder.status).toBe('CANCELLED');
```

```jsx
expect(res.status).toBe(403);
expect(res.body.message).toBeDefined();
const dbOrder = await Order.findById(order._id);
expect(dbOrder.status).toBe('PLACED');
```

**Reasoning:** The suite now proves cancellation is recorded with history for the owner and remains unchanged after restaurant or non-owner attempts.

---

## UC08-T04 — Cancelled order appears in bid list

**Why the previous code was weak:** The test used only `.some(...)`, without first verifying the response body shape or the matched order's status.

### After

```jsx
expect(res.status).toBe(200);
expect(res.body).toBeDefined();
expect(Array.isArray(res.body.data)).toBe(true);
expect(res.body.data.some((o) => String(o._id) === String(order._id))).toBe(true);
const bidOrder = res.body.data.find((o) => String(o._id) === String(order._id));
expect(bidOrder.status).toBe('CANCELLED');
```

**Reasoning:** The response must have the expected collection shape and expose the requested cancelled order with the correct state.

---

## UC14-T01 and T02 — Packaging preference persistence and validation

**Why the previous code was incomplete:** Tests looked only at response values. They did not prove the reusable preference was stored or that an invalid preference could not change the user's profile.

### After

```jsx
expect(res.body).toBeDefined();
expect(res.body.preferences).toBeDefined();
expect(res.body.preferences.packaging).toBe('reusable');
const user = await User.findById(ctx.customer._id);
expect(user.preferences.packaging).toBe('reusable');
```

```jsx
expect(res.status).toBe(400);
expect(res.body.message).toBeDefined();
expect(res.body.message).toMatch(/invalid|not valid|not supported|not allowed/i);
const user = await User.findById(ctx.customer._id);
expect(user.preferences?.packaging).not.toBe('styrofoam');
```

**Reasoning:** The tests now cover both durable success and the absence of an invalid side effect.

---

## UC09-T01 — Combine nearby orders in the same city and ZIP code

**Why the previous code was weak:** The response was checked only for at least two combined orders, their shared status, and a truthy group ID. It did not verify that the two seeded orders were returned, used the same group ID, or were actually updated in the database.

### After

```jsx
expect(res.status).toBe(200);
expect(res.body.combinedOrders).toBeDefined();
expect(Array.isArray(res.body.combinedOrders)).toBe(true);
expect(res.body.combinedOrders.length).toBeGreaterThanOrEqual(2);
expect(res.body.combinedOrders.every((o) => o.status === 'COMBINED')).toBe(true);

const groupId = res.body.combinedOrders[0].combineGroupId;
expect(groupId).toBeTruthy();
expect(res.body.combinedOrders.every((o) => o.combineGroupId === groupId)).toBe(true);

const combinedIds = res.body.combinedOrders.map((o) => String(o._id));
expect(combinedIds).toContain(String(order1._id));
expect(combinedIds).toContain(String(order2._id));

const dbOrder1 = await Order.findById(order1._id);
const dbOrder2 = await Order.findById(order2._id);
expect(dbOrder1.status).toBe('COMBINED');
expect(dbOrder2.status).toBe('COMBINED');
expect(dbOrder1.combineGroupId).toBe(groupId);
expect(dbOrder2.combineGroupId).toBe(groupId);
```

**Reasoning:** The response and persistence checks prove that the intended two orders form one real combine group.

---

## UC09-T02 — Award combine points to each participant

**Why the previous code was incomplete:** It checked only database point deltas, without verifying that the combine request itself succeeded or returned combined orders.

### After

```jsx
const res = await ctx.customerAgent.post('/api/orders/combine').send({
  customerId: ctx.customer._id,
});

expect(res.status).toBe(200);
expect(res.body.combinedOrders).toBeDefined();
expect(res.body.combinedOrders.length).toBeGreaterThanOrEqual(2);
expect(afterA - beforeA).toBe(20);
expect(afterB - beforeB).toBe(20);
expect(afterA).toBeGreaterThan(beforeA);
expect(afterB).toBeGreaterThan(beforeB);
```

**Reasoning:** The test now establishes a successful combine operation before checking that both participants received exactly 20 reward points.

---

## UC09-T03 through T06 — Ineligible combine requests preserve order state

**Why the previous code was incomplete:** No-neighbor, no-active-order, different-location, and `ACCEPTED`-only tests focused on response values. They did not consistently verify response shape, flexible valid error wording, or that no order was modified.

### After

```jsx
expect(res.body).toBeDefined();
expect(res.body.combinedOrders).toBeDefined();
expect(res.body.combinedOrders).toEqual([]);
expect(res.body.message).toMatch(/no nearby|no other|no neighbors/i);
const dbOrder = await Order.findById(order._id);
expect(dbOrder.status).toBe('PLACED');
```

```jsx
expect(res.status).toBe(400);
expect(res.body.message).toBeDefined();
expect(res.body.message).toMatch(/don't have any active orders|no active|no.*order/i);
const orders = await Order.find({ customerId: ctx.customer._id });
expect(orders).toHaveLength(0);
```

```jsx
expect(res.body.combinedOrders).toEqual([]);
const dbOrder1 = await Order.findById(order1._id);
const dbOrder2 = await Order.findById(order2._id);
expect(dbOrder1.status).toBe('PLACED');
expect(dbOrder2.status).toBe('PLACED');
```

```jsx
expect(res.status).toBe(400);
expect(res.body.message).toMatch(/don't have any active orders|only.*PLACED|accepted/i);
expect(dbOrder1.status).toBe('ACCEPTED');
expect(dbOrder2.status).toBe('ACCEPTED');
```

**Reasoning:** These cases now prove that orders that are absent, too far away, or no longer `PLACED` cannot form a group and retain their original state.

---

## Summary

| Tests | Change type | Core issue fixed |
| --- | --- | --- |
| UC06-T01 | Strengthen response checks | Created order contract was only partially checked |
| UC06-T02–T05 | Add persistence and message checks | Failed requests could have written orders unnoticed |
| UC06-T06–T07 | Add database verification | Packaging and reward values were not checked after persistence |
| UC07-T01–T05 | Strengthen tracking assertions | Ownership, details, history, and error content were under-verified |
| UC08-T01–T04 | Add state and response-shape checks | Cancellation effects and bid-list data were under-verified |
| UC14-T01–T02 | Add persistence and no-side-effect checks | Profile preference storage and rejection behavior were under-verified |
| UC09-T01–T06 | Add response, membership, and persistence checks | Combine outcomes and ineligible-order state were under-verified |

**Unchanged by design:** UC14-T03 already verifies that compostable packaging and its 20 eco-reward points are returned when an order is placed.
