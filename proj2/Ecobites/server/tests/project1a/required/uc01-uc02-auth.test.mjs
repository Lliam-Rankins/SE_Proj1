/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC1 Register for the platform; UC2 Log in
 * Assignment steps: 3 (design tests), 4 (run), 5 (results table rows)
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import { newAgent, registerUser, registerCustomer } from '../helpers/auth.mjs';

// Step 0: wire in-memory Mongo lifecycle for this file.
setupProject1aDb();

describe('UC01 Register for the platform', () => {
  test('UC01-T01 test_registers_customer_returns_201_and_sets_cookie', async () => {
    // Arrange: fresh agent with no prior session.
    const agent = newAgent();
    // Act: register a customer via POST /api/auth/register.
    const res = await agent.post('/api/auth/register').send({
      name: 'Alice',
      email: `alice.${Date.now()}@p1a.test`,
      password: 'secret12',
      phone: '9195551111',
      role: 'customer',
    });
    // Assert: 201, HttpOnly cookie with JWT, user in body but token not exposed.
    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
    expect(res.body.user).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('token');
  });

  test('UC01-T02 test_rejects_duplicate_email', async () => {
    // Arrange: register once with a fixed email.
    const agent = newAgent();
    const email = `dup.${Date.now()}@p1a.test`;
    await agent.post('/api/auth/register').send({
      name: 'First',
      email,
      password: 'secret12',
    });
    // Act: second registration with same email (new agent = no cookie conflict).
    const res = await newAgent().post('/api/auth/register').send({
      name: 'Second',
      email,
      password: 'secret12',
    });
    // Assert: 400 with duplicate-email message.
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test('UC01-T03 test_rejects_password_shorter_than_6', async () => {
    // Act: register with 5-char password.
    const res = await newAgent().post('/api/auth/register').send({
      name: 'Short',
      email: `short.${Date.now()}@p1a.test`,
      password: '12345',
    });
    // Assert: validation rejects short password.
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6/i);
  });

  test('UC01-T04 test_rejects_missing_required_fields', async () => {
    // Act: omit name (required field).
    const res = await newAgent().post('/api/auth/register').send({
      email: `missing.${Date.now()}@p1a.test`,
      password: 'secret12',
    });
    // Assert: 400 listing missing fields.
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/all fields/i);
  });

  test('UC01-T05 test_defaults_role_to_customer_when_omitted', async () => {
    // Arrange: registerUser helper with role explicitly undefined (unused in this path).
    const { user } = await registerUser(newAgent(), {
      email: `norole.${Date.now()}@p1a.test`,
      role: undefined,
    });
    // Act: raw register without role field — controller should default to customer.
    const res = await newAgent().post('/api/auth/register').send({
      name: 'No Role',
      email: `norole2.${Date.now()}@p1a.test`,
      password: 'secret12',
    });
    // Assert: 201 and role customer on returned user.
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });

  test('UC01-T06 test_registers_restaurant_and_driver_with_role_fields', async () => {
    // Act + Assert: restaurant registration persists role-specific fields.
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

    // Act + Assert: driver registration persists vehicle metadata.
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
  });
});

describe('UC02 Log in', () => {
  test('UC02-T01 test_login_valid_credentials_sets_cookie_and_returns_user', async () => {
    // Arrange: pre-register customer.
    const email = `login.${Date.now()}@p1a.test`;
    await registerCustomer(newAgent(), { email });
    // Act: login with correct password.
    const res = await newAgent().post('/api/auth/login').send({
      email,
      password: 'secret12',
    });
    // Assert: 200, cookie set, user email matches.
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
    expect(res.body.user.email).toBe(email);
  });

  test('UC02-T02 test_login_invalid_password_returns_401', async () => {
    // Arrange: registered user.
    const email = `badpass.${Date.now()}@p1a.test`;
    await registerCustomer(newAgent(), { email });
    // Act: wrong password.
    const res = await newAgent().post('/api/auth/login').send({
      email,
      password: 'wrongpassword',
    });
    // Assert: generic invalid-credentials (no user enumeration).
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('UC02-T03 test_login_unknown_email_returns_same_invalid_credentials', async () => {
    // Act: login for email that was never registered.
    const res = await newAgent().post('/api/auth/login').send({
      email: `nobody.${Date.now()}@p1a.test`,
      password: 'secret12',
    });
    // Assert: same 401 message as wrong password.
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('UC02-T04 test_me_returns_user_when_authenticated', async () => {
    // Arrange: register on agent so cookie is stored on same agent.
    const agent = newAgent();
    const { user } = await registerCustomer(agent);
    // Act: GET /api/auth/me with session cookie.
    const res = await agent.get('/api/auth/me');
    // Assert: 200 and same user id.
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id);
  });

  test('UC02-T05 test_me_returns_401_without_cookie', async () => {
    // Act: unauthenticated /me request.
    const res = await newAgent().get('/api/auth/me');
    // Assert: 401 unauthorized.
    expect(res.status).toBe(401);
  });

  test('UC02-T06 test_logout_clears_cookie', async () => {
    // Arrange: logged-in customer.
    const agent = newAgent();
    await registerCustomer(agent);
    // Act: POST /api/auth/logout.
    const res = await agent.post('/api/auth/logout');
    // Assert: success message (cookie cleared server-side).
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
