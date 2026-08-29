/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: register/login agents for UC tests
 */
import request from 'supertest';
import app from './app.mjs';

let emailCounter = 0;
const uniqueEmail = (prefix = 'user') =>
  `${prefix}.${Date.now()}.${++emailCounter}@p1a.test`;

export const newAgent = () => request.agent(app);

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

export const loginUser = async (agent, email, password = 'secret12') => {
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status >= 400) {
    throw new Error(`login failed: ${res.status} ${res.text}`);
  }
  return res;
};

export const registerCustomer = (agent, overrides = {}) =>
  registerUser(agent, { role: 'customer', name: 'Customer', ...overrides });

export const registerRestaurant = (agent, overrides = {}) =>
  registerUser(agent, {
    role: 'restaurant',
    name: 'Resto Owner',
    restaurantName: overrides.restaurantName || 'Green Kitchen',
    cuisine: overrides.cuisine || ['Vegan'],
    ...overrides,
  });

export const registerDriver = (agent, overrides = {}) =>
  registerUser(agent, {
    role: 'driver',
    name: 'Driver Dan',
    vehicleType: overrides.vehicleType || 'EV',
    licensePlate: overrides.licensePlate || 'ECO-1',
    ...overrides,
  });
