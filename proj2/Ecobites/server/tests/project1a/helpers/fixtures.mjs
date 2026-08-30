/**
 * Deliverable support: D3 only (not a Moodle hand-in artifact)
 * Purpose: seed restaurant/menu/order fixtures for UC6–UC20 tests
 *
 * Central place for test addresses, marketplace actors, and direct DB seeding.
 * Prefer createSeededOrder over placeOrderViaApi when geocoding latency is not under test.
 */
import { MenuItem } from '../../../src/models/MenuItem.model.js';
import { Order } from '../../../src/models/Order.model.js';
import { Bid } from '../../../src/models/Bid.model.js';
import Review from '../../../src/models/Review.model.js';
import { User } from '../../../src/models/User.model.js';
import {
  newAgent,
  registerCustomer,
  registerRestaurant,
  registerDriver,
} from './auth.mjs';

/** Default Raleigh delivery address used across order/combine/bid tests. */
export const raleighAddress = (overrides = {}) => ({
  street: overrides.street || '100 Main St',
  city: overrides.city || 'Raleigh',
  zipCode: overrides.zipCode || '27606',
  coordinates: overrides.coordinates || { lat: 35.78, lng: -78.67 },
});

/** Slightly offset coords — within combine radius of raleighAddress. */
export const nearbyAddress = () =>
  raleighAddress({
    street: '110 Main St',
    coordinates: { lat: 35.7805, lng: -78.6705 },
  });

/** Different city/zip — should NOT match combine logic with Raleigh orders. */
export const farAddress = () =>
  raleighAddress({
    street: '1 Far Rd',
    city: 'Durham',
    zipCode: '27701',
    coordinates: { lat: 35.99, lng: -78.9 },
  });

/**
 * Seeds a restaurant + one menu item + optional customer/driver agents.
 * Prefer seeding Order.create for non-UC6 flows to avoid createOrder's 1s geocode sleep.
 *
 * Returns four authenticated agents and their user records plus one menu item.
 */
export const seedMarketplaceActors = async () => {
  const restaurantAgent = newAgent();
  const customerAgent = newAgent();
  const neighborAgent = newAgent();
  const driverAgent = newAgent();

  const { user: restaurant } = await registerRestaurant(restaurantAgent);
  const { user: customer } = await registerCustomer(customerAgent, {
    name: 'Alice',
    address: raleighAddress(),
  });
  const { user: neighbor } = await registerCustomer(neighborAgent, {
    name: 'Bob',
    address: nearbyAddress(),
  });
  const { user: driver } = await registerDriver(driverAgent);

  const menuItem = await MenuItem.create({
    restaurantId: restaurant._id,
    name: 'Eco Bowl',
    description: 'Seasonal greens',
    price: 12,
    category: 'main',
    isAvailable: true,
    packagingOptions: ['reusable', 'compostable', 'minimal'],
  });

  return {
    restaurantAgent,
    customerAgent,
    neighborAgent,
    driverAgent,
    restaurant,
    customer,
    neighbor,
    driver,
    menuItem,
  };
};

/**
 * Insert an Order document directly (bypasses HTTP + geocoding).
 * Use extras to set combineGroupId, driverId, claimedBy, etc.
 */
export const createSeededOrder = async ({
  customerId,
  restaurantId,
  menuItem,
  status = 'PLACED',
  deliveryAddress = raleighAddress(),
  packagingPreference = 'reusable',
  ecoRewardPoints = 30,
  extras = {},
}) => {
  const order = await Order.create({
    customerId,
    restaurantId,
    items: [
      {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
      },
    ],
    status,
    packagingPreference,
    ecoRewardPoints,
    deliveryAddress,
    subtotal: menuItem.price,
    deliveryFee: 0,
    tax: 0,
    total: menuItem.price,
    statusHistory: [{ status, updatedBy: String(customerId) }],
    ...extras,
  });
  return order;
};

/** POST /api/orders through the HTTP stack (exercises createOrder + geocode path). */
export const placeOrderViaApi = async (
  agent,
  { customerId, restaurantId, menuItemId, packagingPreference = 'reusable', deliveryAddress = raleighAddress(), extras = {} }
) => {
  return agent.post('/api/orders').send({
    customerId,
    restaurantId,
    items: [{ menuItemId, quantity: 1 }],
    packagingPreference,
    deliveryAddress,
    paymentMethod: 'card',
    ...extras,
  });
};

// Re-export models so tests can assert DB state without extra import paths.
export { MenuItem, Order, Bid, Review, User };
