/**
 * Deliverable: D3 (student-authored tests for D2 use cases)
 * Use cases: UC3 Browse restaurants; UC4 View a restaurant menu; UC5 Discover seasonal items
 * Assignment steps: 3, 4, 5
 */
import { setupProject1aDb } from '../helpers/db.mjs';
import { newAgent, registerRestaurant } from '../helpers/auth.mjs';
import { MenuItem, User } from '../helpers/fixtures.mjs';

setupProject1aDb();

describe('UC03 Browse restaurants', () => {
  test('UC03-T01 test_lists_restaurants_with_count_and_data_array', async () => {
    // Arrange: seed two restaurant accounts.
    await registerRestaurant(newAgent(), {
      restaurantName: 'Alpha Bites',
      email: `alpha.${Date.now()}@p1a.test`,
    });
    await registerRestaurant(newAgent(), {
      restaurantName: 'Beta Bites',
      email: `beta.${Date.now()}@p1a.test`,
    });
    // Act: public list endpoint.
    const res = await newAgent().get('/api/restaurants');
    // Assert: success wrapper with count and data array.
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('UC03-T02 test_get_restaurant_by_id_returns_profile', async () => {
    // Arrange: one registered restaurant.
    const { user } = await registerRestaurant(newAgent(), {
      restaurantName: 'Detail Cafe',
      email: `detail.${Date.now()}@p1a.test`,
    });
    // Act: fetch by Mongo id.
    const res = await newAgent().get(`/api/restaurants/${user._id}`);
    // Assert: profile fields and recentReviews slot present.
    expect(res.status).toBe(200);
    expect(res.body.data.restaurantName).toBe('Detail Cafe');
    expect(res.body).toHaveProperty('recentReviews');
  });

  test('UC03-T03 test_get_restaurant_by_id_returns_404_for_non_restaurant', async () => {
    // Arrange: restaurant exists but we query a customer id instead.
    const { user } = await registerRestaurant(newAgent(), {
      email: `gone.${Date.now()}@p1a.test`,
    });
    const { registerCustomer } = await import('../helpers/auth.mjs');
    const { user: customer } = await registerCustomer(newAgent());
    // Act: GET restaurant profile for customer id.
    const res = await newAgent().get(`/api/restaurants/${customer._id}`);
    // Assert: 404 — id is valid ObjectId but not a restaurant role.
    expect(res.status).toBe(404);
  });

  test('UC03-T04 test_list_includes_restaurant_even_when_isAvailable_false', async () => {
    // Arrange: restaurant then mark unavailable in DB.
    const { user } = await registerRestaurant(newAgent(), {
      restaurantName: 'Closed Kitchen',
      email: `closed.${Date.now()}@p1a.test`,
    });
    await User.findByIdAndUpdate(user._id, { isAvailable: false });
    // Act: list all restaurants.
    const res = await newAgent().get('/api/restaurants');
    // Assert: closed kitchen still listed with isAvailable false.
    expect(res.status).toBe(200);
    const found = res.body.data.find((r) => String(r._id) === String(user._id));
    expect(found).toBeTruthy();
    expect(found.isAvailable).toBe(false);
  });
});

describe('UC04 View a restaurant menu', () => {
  test('UC04-T01 test_get_menu_returns_available_items_only', async () => {
    // Arrange: restaurant with one available and one hidden menu item.
    const { user: restaurant } = await registerRestaurant(newAgent(), {
      email: `menu.${Date.now()}@p1a.test`,
    });
    await MenuItem.create({
      restaurantId: restaurant._id,
      name: 'Available Soup',
      price: 8,
      isAvailable: true,
    });
    await MenuItem.create({
      restaurantId: restaurant._id,
      name: 'Hidden Soup',
      price: 9,
      isAvailable: false,
    });
    // Act: GET menu for restaurant.
    const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
    // Assert: only available item returned.
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Available Soup');
  });

  test('UC04-T02 test_get_menu_returns_empty_array_when_none_available', async () => {
    // Arrange: restaurant with no menu items.
    const { user: restaurant } = await registerRestaurant(newAgent(), {
      email: `empty.${Date.now()}@p1a.test`,
    });
    // Act + Assert: empty array, not 404.
    const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('UC04-T03 test_get_menu_is_public_without_auth', async () => {
    // Arrange: menu item exists; use unauthenticated agent.
    const { user: restaurant } = await registerRestaurant(newAgent(), {
      email: `public.${Date.now()}@p1a.test`,
    });
    await MenuItem.create({
      restaurantId: restaurant._id,
      name: 'Public Dish',
      price: 5,
      isAvailable: true,
    });
    // Act: no login required.
    const res = await newAgent().get(`/api/menu/restaurant/${restaurant._id}`);
    // Assert: public read succeeds.
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Public Dish');
  });
});

describe('UC05 Discover seasonal items', () => {
  test('UC05-T01 test_get_seasonal_all_returns_only_seasonal_available_items', async () => {
    // Arrange: one seasonal + one regular item for same restaurant.
    const { user: restaurant } = await registerRestaurant(newAgent(), {
      email: `season.${Date.now()}@p1a.test`,
    });
    await MenuItem.create({
      restaurantId: restaurant._id,
      name: 'Fall Salad',
      price: 11,
      isAvailable: true,
      isSeasonal: true,
      seasonalLabel: 'Fall',
      seasonalRewardPoints: 5,
    });
    await MenuItem.create({
      restaurantId: restaurant._id,
      name: 'Regular Soup',
      price: 7,
      isAvailable: true,
      isSeasonal: false,
    });
    // Act: global seasonal discovery endpoint.
    const res = await newAgent().get('/api/menu/seasonal');
    // Assert: every result flagged seasonal; Fall Salad included.
    expect(res.status).toBe(200);
    expect(res.body.every((i) => i.isSeasonal === true)).toBe(true);
    expect(res.body.some((i) => i.name === 'Fall Salad')).toBe(true);
  });

  test('UC05-T02 test_get_seasonal_all_limits_to_20_most_recent', async () => {
    // Arrange: insert 22 seasonal items (exceeds cap).
    const { user: restaurant } = await registerRestaurant(newAgent(), {
      email: `cap.${Date.now()}@p1a.test`,
    });
    const docs = [];
    for (let i = 0; i < 22; i++) {
      docs.push({
        restaurantId: restaurant._id,
        name: `Seasonal ${i}`,
        price: 10,
        isAvailable: true,
        isSeasonal: true,
        seasonalRewardPoints: 1,
      });
    }
    await MenuItem.insertMany(docs);
    // Act: list seasonal.
    const res = await newAgent().get('/api/menu/seasonal');
    // Assert: server caps at 20.
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(20);
  });

  test('UC05-T03 test_seasonal_item_unavailable_excluded_from_lists', async () => {
    // Arrange: seasonal item marked unavailable.
    const { user: restaurant } = await registerRestaurant(newAgent(), {
      email: `unavail.${Date.now()}@p1a.test`,
    });
    await MenuItem.create({
      restaurantId: restaurant._id,
      name: 'Gone Seasonal',
      price: 10,
      isAvailable: false,
      isSeasonal: true,
      seasonalRewardPoints: 5,
    });
    // Act: per-restaurant seasonal sub-route.
    const res = await newAgent().get(
      `/api/menu/restaurant/${restaurant._id}/seasonal`
    );
    // Assert: unavailable seasonal excluded.
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
