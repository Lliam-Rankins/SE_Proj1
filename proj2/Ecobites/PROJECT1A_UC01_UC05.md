# Parth’s changes to AI code

## Files modified

- proj2/Ecobites/server/tests/project1a/required/uc01-uc02-auth.test.mjs
- proj2/Ecobites/server/tests/project1a/required/uc03-uc05-browse-menu.test.mjs

**Verification:** All tests in these two files passed on the branch after the final review pass.

## UC01-T01 — Register customer returns 201 and sets JWT cookie

**Why the previous version was strong:** This was already a solid happy-path test; the main improvement was making the auth contract explicit: the JWT is set via cookie, not exposed in the JSON body.

### Before

```jsx
const res = await agent.post('/api/auth/register').send({
  name: 'Alice',
  email: `alice.${Date.now()}@p1a.test`,
  password: 'secret12',
  phone: '9195551111',
  role: 'customer',
});
expect(res.status).toBe(201);
expect(res.body.user).toHaveProperty('email');
```

### After

```jsx
const res = await agent.post('/api/auth/register').send({
  name: 'Alice',
  email: `alice.${Date.now()}@p1a.test`,
  password: 'secret12',
  phone: '9195551111',
  role: 'customer',
});

expect(res.status).toBe(201);
expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
expect(res.body.user).toHaveProperty('email');
expect(res.body).not.toHaveProperty('token');
```

**Reasoning:** This verifies the real contract: registration succeeds, a server-side session is created, and the JWT is not leaked to the client JSON.

---

## UC01-T02 — Reject duplicate email

**Why the previous version was strong:** The duplicate-email case already covered the correct user flow; it was tightened to assert the exact business error.

### Before

```jsx
const res = await newAgent().post('/api/auth/register').send({
  name: 'Second',
  email,
  password: 'secret12',
});
expect(res.status).toBe(400);
```

### After

```jsx
const res = await newAgent().post('/api/auth/register').send({
  name: 'Second',
  email,
  password: 'secret12',
});
expect(res.status).toBe(400);
expect(res.body.error).toMatch(/already registered/i);
```

**Reasoning:** This ensures the failure matches the intended validation behavior, not just any 400.

---

## UC01-T03 — Reject short password

**Why the previous version was strong:** This was already a valid validation test; the final assertion makes the rule explicit.

### Before

```jsx
const res = await newAgent().post('/api/auth/register').send({
  name: 'Short',
  email: `short.${Date.now()}@p1a.test`,
  password: '12345',
});
expect(res.status).toBe(400);
```

### After

```jsx
const res = await newAgent().post('/api/auth/register').send({
  name: 'Short',
  email: `short.${Date.now()}@p1a.test`,
  password: '12345',
});
expect(res.status).toBe(400);
expect(res.body.error).toMatch(/at least 6/i);
```

**Reasoning:** This confirms the exact password policy instead of only checking for a generic 400.

---

## UC01-T04 — Reject missing required fields

**Why the previous version was strong:** This already covered required-field validation correctly.

### Before

```jsx
const res = await newAgent().post('/api/auth/register').send({
  email: `missing.${Date.now()}@p1a.test`,
  password: 'secret12',
});
expect(res.status).toBe(400);
```

### After

```jsx
const res = await newAgent().post('/api/auth/register').send({
  email: `missing.${Date.now()}@p1a.test`,
  password: 'secret12',
});
expect(res.status).toBe(400);
expect(res.body.error).toMatch(/all fields/i);
```

**Reasoning:** This ensures the server reports the actual validation issue instead of failing generically.

---

## UC01-T05 — Default role to customer when omitted

**Why the previous version was strong:** This test correctly captures the implicit defaulting rule.

### Before

```jsx
const res = await newAgent().post('/api/auth/register').send({
  name: 'No Role',
  email: `norole2.${Date.now()}@p1a.test`,
  password: 'secret12',
});
expect(res.status).toBe(201);
```

### After

```jsx
const res = await newAgent().post('/api/auth/register').send({
  name: 'No Role',
  email: `norole2.${Date.now()}@p1a.test`,
  password: 'secret12',
});
expect(res.status).toBe(201);
expect(res.body.user.role).toBe('customer');
```

**Reasoning:** It proves the role is not just accepted, but defaulted to the correct value.

---

## UC01-T06 — Register restaurant and driver with role metadata

**Why the previous version was strong:** This was already the correct role-specific check and validates the product’s actual behavior.

### Before

```jsx
const resto = await newAgent().post('/api/auth/register').send({
  name: 'Chef',
  email: `resto.${Date.now()}@p1a.test`,
  password: 'secret12',
  role: 'restaurant',
  restaurantName: 'Leaf Cafe',
  cuisine: ['Thai'],
});
expect(resto.status).toBe(201);
```

### After

```jsx
const resto = await newAgent().post('/api/auth/register').send({
  name: 'Chef',
  email: `resto.${Date.now()}@p1a.test`,
  password: 'secret12',
  role: 'restaurant',
  restaurantName: 'Leaf Cafe',
  cuisine: ['Thai'],
});
expect(resto.status).toBe(201);
expect(resto.body.user.role).toBe('restaurant');
expect(resto.body.user.restaurantName).toBe('Leaf Cafe');

const driver = await newAgent().post('/api/auth/register').send({
  name: 'Dan',
  email: `drv.${Date.now()}@p1a.test`,
  password: 'secret12',
  role: 'driver',
  vehicleType: 'Bike',
  licensePlate: 'BIKE-9',
});
expect(driver.status).toBe(201);
expect(driver.body.user.role).toBe('driver');
expect(driver.body.user.vehicleType).toBe('Bike');
```

**Reasoning:** This confirms both role-specific profiles are properly persisted and returned.

---

## UC02-T01 — Login valid credentials

**Why the previous version was strong:** Already a valid happy-path check, and the final version makes the auth contract explicit.

### Before

```jsx
const res = await newAgent().post('/api/auth/login').send({
  email,
  password: 'secret12',
});
expect(res.status).toBe(200);
```

### After

```jsx
const res = await newAgent().post('/api/auth/login').send({
  email,
  password: 'secret12',
});
expect(res.status).toBe(200);
expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
expect(res.body.user.email).toBe(email);
```

**Reasoning:** This checks both the login response and the session mechanism rather than only checking the status code.

---

## UC02-T02 / T03 — Invalid password and unknown email

**Why the previous version was strong:** These were already accurate auth security tests. The final version tightens the value-based assertion.

### Before

```jsx
expect(res.status).toBe(401);
```

### After

```jsx
expect(res.status).toBe(401);
expect(res.body.error).toMatch(/invalid credentials/i);
```

**Reasoning:** This ensures the system handles bad credentials consistently and does not leak extra information.

---

## UC02-T04 / T05 / T06 — /me and logout

**Why the previous version was strong:** These were already correct as session lifecycle tests.

### Before

```jsx
const res = await agent.get('/api/auth/me');
expect(res.status).toBe(200);
```

### After

```jsx
const res = await agent.get('/api/auth/me');
expect(res.status).toBe(200);
expect(res.body.user._id).toBe(user._id);

const res = await newAgent().get('/api/auth/me');
expect(res.status).toBe(401);

const res = await agent.post('/api/auth/logout');
expect(res.status).toBe(200);
expect(res.body.message).toMatch(/logged out/i);
```

**Reasoning:** Together these confirm the session lifecycle works correctly: authenticated access succeeds, unauthenticated access fails, and logout clears the session.

---

## UC03-T01 — List restaurants with count and data array

**Why the previous version was strong:** This is already a correct API contract test.

### Before

```jsx
const res = await newAgent().get('/api/restaurants');
expect(res.status).toBe(200);
expect(res.body.count).toBeGreaterThanOrEqual(2);
```

### After

```jsx
const res = await newAgent().get('/api/restaurants');
expect(res.status).toBe(200);
expect(res.body.success).toBe(true);
expect(res.body.count).toBeGreaterThanOrEqual(2);
expect(Array.isArray(res.body.data)).toBe(true);
```

**Reasoning:** This makes the response shape explicit and ensures it matches the intended product contract.

---

## UC03-T02 — Get restaurant by ID returns profile

**Why the previous version was strong:** This correctly validates the profile fetch.

### Before

```jsx
const res = await newAgent().get(`/api/restaurants/${user._id}`);
expect(res.status).toBe(200);
```

### After

```jsx
const res = await newAgent().get(`/api/restaurants/${user._id}`);
expect(res.status).toBe(200);
expect(res.body.data.restaurantName).toBe('Detail Cafe');
expect(res.body).toHaveProperty('recentReviews');
```

**Reasoning:** This checks the actual contract of the restaurant-profile API and not just a generic 200.

---

## UC03-T03 — Non-restaurant ID returns 404

**Why the previous version was strong:** This was already the correct edge-case test.

### Before

```jsx
const res = await newAgent().get(`/api/restaurants/${customer._id}`);
expect(res.status).toBe(404);
```

### After

```jsx
const res = await newAgent().get(`/api/restaurants/${customer._id}`);
expect(res.status).toBe(404);
```

**Reasoning:** No change needed; the assertion is precise and aligned to the code.

---

## UC03-T04 — Restaurant still listed when isAvailable=false

**Why the previous version was strong:** This captures a meaningful product behavior: the list is not filtered by availability.

### Before

```jsx
const res = await newAgent().get('/api/restaurants');
const found = res.body.data.find((r) => String(r._id) === String(user._id));
expect(found).toBeTruthy();
```

### After

```jsx
const res = await newAgent().get('/api/restaurants');
const found = res.body.data.find((r) => String(r._id) === String(user._id));
expect(res.status).toBe(200);
expect(found).toBeTruthy();
expect(found.isAvailable).toBe(false);
```

**Reasoning:** This confirms the API returns the restaurant in the directory even when the restaurant is marked unavailable.

---

## UC04-T01 — Menu returns available items only

**Why the previous version was strong:** This is already the correct implementation test.

### Before

```jsx
const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
expect(res.status).toBe(200);
expect(res.body).toHaveLength(1);
```

### After

```jsx
const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
expect(res.status).toBe(200);
expect(res.body).toHaveLength(1);
expect(res.body[0].name).toBe('Available Soup');
```

**Reasoning:** This confirms the correct item is returned and not just any available item.

---

## UC04-T02 — Empty menu returns empty array

**Why the previous version was strong:** This matches the real API contract.

### Before

```jsx
const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
expect(res.status).toBe(200);
expect(res.body).toEqual([]);
```

### After

```jsx
const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
expect(res.status).toBe(200);
expect(res.body).toEqual([]);
```

**Reasoning:** This is a precise contract check: empty menu, not 404.

---

## UC04-T03 — Menu is public without auth

**Why the previous version was strong:** This accurately tests the public-read contract.

### Before

```jsx
const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
expect(res.status).toBe(200);
```

### After

```jsx
const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
expect(res.status).toBe(200);
expect(res.body[0].name).toBe('Public Dish');
```

**Reasoning:** This confirms the endpoint is public and returns the correct data, not just any response.

---

## UC05-T01 — Seasonal list returns only seasonal available items

**Why the previous version was strong:** This is an important product rule and the test is already well aligned with the code.

### Before

```jsx
const res = await newAgent().get('/api/menu/seasonal');
expect(res.status).toBe(200);
expect(res.body.every((i) => i.isSeasonal === true)).toBe(true);
```

### After

```jsx
const res = await newAgent().get('/api/menu/seasonal');
expect(res.status).toBe(200);
expect(res.body.every((i) => i.isSeasonal === true)).toBe(true);
expect(res.body.some((i) => i.name === 'Fall Salad')).toBe(true);
```

**Reasoning:** This verifies the list not only contains seasonal items, but the expected seasonal item is actually in the payload.

---

## UC05-T02 — Seasonal list limits to 20 most recent

**Why the previous version was strong:** This is a precise boundary test for the list cap.

### Before

```jsx
const res = await newAgent().get('/api/menu/seasonal');
expect(res.status).toBe(200);
expect(res.body.length).toBeLessThanOrEqual(20);
```

### After

```jsx
const res = await newAgent().get('/api/menu/seasonal');
expect(res.status).toBe(200);
expect(res.body.length).toBeLessThanOrEqual(20);
```

**Reasoning:** No change needed; the assertion directly matches the requirement and implementation cap.

---

## UC05-T03 — Unavailable seasonal item is excluded

**Why the previous version was strong:** This is the correct edge-case test.

### Before

```jsx
const res = await newAgent().get(
  `/api/menu/restaurant/${restaurant._id}/seasonal`
);
expect(res.status).toBe(200);
expect(res.body).toHaveLength(0);
```

### After

```jsx
const res = await newAgent().get(
  `/api/menu/restaurant/${restaurant._id}/seasonal`
);
expect(res.status).toBe(200);
expect(res.body).toHaveLength(0);
```

**Reasoning:** This confirms the rule: unavailable seasonal items are filtered out.

---

## Verification

**Command run:**
- npm run test:1a:required

**Result:**
- UC01–UC02: PASS
- UC03–UC05: PASS

**Total for this scope:**
- 22 tests passed
- 0 failed

This is the final version for the exact requested scope: UC01–UC05 only.

## Summary

| Test | Change type | Core issue fixed |
| --- | --- | --- |
| UC01-T01 | Tighten + contract check | JWT should be cookie-based, not leaked in JSON |
| UC01-T02 | Tighten + exact error | Duplicate email should fail with the business error, not generic 400 |
| UC01-T03 | Tighten + exact validation | Short password should assert the actual minimum-length rule |
| UC01-T04 | Tighten + exact validation | Missing required fields should report the actual validation issue |
| UC01-T05 | Tighten + role default | Omitted role should default to `customer` and be persisted |
| UC01-T06 | Tighten + role metadata | Restaurant/driver role payloads should assert correct metadata |
| UC02-T01 | Tighten + contract check | Successful login should set JWT cookie and return authenticated user |
| UC02-T02 | Tighten + exact failure | Invalid credentials should reject with a clear auth error |
| UC03-T01 | Tighten + exact list semantics | Restaurant list should match expected results, not just any 200 |
| UC04-T01 | Tighten + menu contract | Menu lookup should return the expected restaurant menu payload |
| UC05-T01 | Tighten + seasonal filtering | Seasonal items should be returned only when expected, with correct filtering |

**Unchanged (by design):** The scope remains intentionally limited to UC01–UC05, with the targeted auth and browse/menu coverage preserved and strengthened without expanding into unrelated project findings.
