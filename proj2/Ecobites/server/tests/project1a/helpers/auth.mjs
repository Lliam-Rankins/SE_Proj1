/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: register/login agents for UC tests
 *
 * Provides supertest agents (cookie jars) and helpers to register users by role.
 * Each agent keeps its own session cookie after register/login.
 */
import request from 'supertest';
import app from './app.mjs';

// Monotonic counter so parallel tests never collide on email addresses.
let emailCounter = 0;
const uniqueEmail = (prefix = 'user') =>
  `${prefix}.${Date.now()}.${++emailCounter}@p1a.test`;

/** Returns a fresh supertest agent bound to the mocked Express app. */
export const newAgent = () => request.agent(app);

/**
 * POST /api/auth/register with sensible defaults; merges overrides last.
 * Throws if the server returns 4xx/5xx so setup failures surface early.
 */
export const registerUser = async (agent, overrides = {}) => {
  const payload = {
    name: overrides.name || 'P1A User',
    email: overrides.email || uniqueEmail(overrides.role || 'user'),
    password: overrides.password || 'secret12',
    phone: overrides.phone || '9195550000',
    role: overrides.role || 'customer',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(payload);
  if (res.status >= 400) {
    throw new Error(`register failed: ${res.status} ${res.text}`);
  }
  return { res, user: res.body.user, payload };
};

/** POST /api/auth/login; agent retains the auth cookie on success. */
export const loginUser = async (agent, email, password = 'secret12') => {
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status >= 400) {
    throw new Error(`login failed: ${res.status} ${res.text}`);
  }
  return res;
};

/** Convenience wrapper: role=customer with display name preset. */
export const registerCustomer = (agent, overrides = {}) =>
  registerUser(agent, { role: 'customer', name: 'Customer', ...overrides });

/** Convenience wrapper: role=restaurant with restaurantName/cuisine defaults. */
export const registerRestaurant = (agent, overrides = {}) =>
  registerUser(agent, {
    role: 'restaurant',
    name: 'Resto Owner',
    restaurantName: overrides.restaurantName || 'Green Kitchen',
    cuisine: overrides.cuisine || ['Vegan'],
    ...overrides,
  });

/** Convenience wrapper: role=driver with vehicle fields for UC19/UC20 reward tests. */
export const registerDriver = (agent, overrides = {}) =>
  registerUser(agent, {
    role: 'driver',
    name: 'Driver Dan',
    vehicleType: overrides.vehicleType || 'EV',
    licensePlate: overrides.licensePlate || 'ECO-1',
    ...overrides,
  });
