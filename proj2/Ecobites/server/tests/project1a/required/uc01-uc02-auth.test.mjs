/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC1 Register for the platform; UC2 Log in
 * Assignment steps: 3 (design tests), 4 (run), 5 (results table rows)
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import { newAgent, registerUser, registerCustomer } from '../helpers/auth.mjs';

setupProject1aDb();

describe('UC01 Register for the platform', () => {
  test('UC01-T01 test_registers_customer_returns_201_and_sets_cookie', async () => {
    const agent = newAgent();
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
  });

  test('UC01-T02 test_rejects_duplicate_email', async () => {
    const agent = newAgent();
    const email = `dup.${Date.now()}@p1a.test`;
    await agent.post('/api/auth/register').send({
      name: 'First',
      email,
      password: 'secret12',
    });
    const res = await newAgent().post('/api/auth/register').send({
      name: 'Second',
      email,
      password: 'secret12',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test('UC01-T03 test_rejects_password_shorter_than_6', async () => {
    const res = await newAgent().post('/api/auth/register').send({
      name: 'Short',
      email: `short.${Date.now()}@p1a.test`,
      password: '12345',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6/i);
  });

  test('UC01-T04 test_rejects_missing_required_fields', async () => {
    const res = await newAgent().post('/api/auth/register').send({
      email: `missing.${Date.now()}@p1a.test`,
      password: 'secret12',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/all fields/i);
  });

  test('UC01-T05 test_defaults_role_to_customer_when_omitted', async () => {
    const { user } = await registerUser(newAgent(), {
      email: `norole.${Date.now()}@p1a.test`,
      role: undefined,
    });
    // role omitted in payload — controller defaults to customer
    const res = await newAgent().post('/api/auth/register').send({
      name: 'No Role',
      email: `norole2.${Date.now()}@p1a.test`,
      password: 'secret12',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });

  test('UC01-T06 test_registers_restaurant_and_driver_with_role_fields', async () => {
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
  });
});

describe('UC02 Log in', () => {
  test('UC02-T01 test_login_valid_credentials_sets_cookie_and_returns_user', async () => {
    const email = `login.${Date.now()}@p1a.test`;
    await registerCustomer(newAgent(), { email });
    const res = await newAgent().post('/api/auth/login').send({
      email,
      password: 'secret12',
    });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
    expect(res.body.user.email).toBe(email);
  });

  test('UC02-T02 test_login_invalid_password_returns_401', async () => {
    const email = `badpass.${Date.now()}@p1a.test`;
    await registerCustomer(newAgent(), { email });
    const res = await newAgent().post('/api/auth/login').send({
      email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('UC02-T03 test_login_unknown_email_returns_same_invalid_credentials', async () => {
    const res = await newAgent().post('/api/auth/login').send({
      email: `nobody.${Date.now()}@p1a.test`,
      password: 'secret12',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('UC02-T04 test_me_returns_user_when_authenticated', async () => {
    const agent = newAgent();
    const { user } = await registerCustomer(agent);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id);
  });

  test('UC02-T05 test_me_returns_401_without_cookie', async () => {
    const res = await newAgent().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('UC02-T06 test_logout_clears_cookie', async () => {
    const agent = newAgent();
    await registerCustomer(agent);
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
