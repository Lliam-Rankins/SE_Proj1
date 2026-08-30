import request from 'supertest';
import app from '../../src/app.js';
import { connectDB, closeDB, clearDB } from '../../src/setupTests.js';

beforeAll(async () => {
  await connectDB();
}, 30000);

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

describe('Restaurants and Menu endpoints', () => {
  test('GET /api/restaurants returns list of restaurants', async () => {
    // register two restaurants
    await request(app).post('/api/auth/register').send({
      name: 'Rest One',
      email: 'rest1@example.com',
      password: 'password123',
      role: 'restaurant',
      restaurantName: 'Rest One'
    });

    await request(app).post('/api/auth/register').send({
      name: 'Rest Two',
      email: 'rest2@example.com',
      password: 'password123',
      role: 'restaurant',
      restaurantName: 'Rest Two'
    });

    const res = await request(app).get('/api/restaurants');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('count', 2);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('email');
  });

  test('GET /api/restaurants/:id returns restaurant with recentReviews', async () => {
    // register a restaurant
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Rest Three',
      email: 'rest3@example.com',
      password: 'password123',
      role: 'restaurant',
      restaurantName: 'Rest Three'
    });

    const restaurant = regRes.body.user;
    expect(restaurant).toHaveProperty('_id');

    // create a customer and post a review for the restaurant
    const custRes = await request(app).post('/api/auth/register').send({
      name: 'Cust A',
      email: 'custA@example.com',
      password: 'password123',
      role: 'customer'
    });

    const review = {
      restaurantId: restaurant._id,
      rating: 4,
      comment: 'Great food'
    };

    // login as customer to get cookie
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'custA@example.com',
      password: 'password123'
    });

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    await request(app)
      .post('/api/reviews')
      .set('Cookie', cookies)
      .send(review)
      .expect(201);

    const res = await request(app).get(`/api/restaurants/${restaurant._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('_id', restaurant._id);
    expect(Array.isArray(res.body.recentReviews)).toBe(true);
    expect(res.body.recentReviews.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/menu requires restaurant role and allows restaurant user', async () => {
    // register a customer and try to create menu item
    await request(app).post('/api/auth/register').send({
      name: 'Cust B',
      email: 'custB@example.com',
      password: 'password123',
      role: 'customer'
    });

    const loginCust = await request(app).post('/api/auth/login').send({
      email: 'custB@example.com',
      password: 'password123'
    });

    const custCookies = loginCust.headers['set-cookie'];
    expect(custCookies).toBeDefined();

    // attempt to create menu item as customer
    const badRes = await request(app)
      .post('/api/menu')
      .set('Cookie', custCookies)
      .send({
        restaurantId: 'fakeid',
        name: 'Burger',
        price: 9.99
      });

    expect([401,403]).toContain(badRes.statusCode);

    // register a restaurant and create menu item
    const regRest = await request(app).post('/api/auth/register').send({
      name: 'Rest Four',
      email: 'rest4@example.com',
      password: 'password123',
      role: 'restaurant',
      restaurantName: 'Rest Four'
    });

    const rest = regRest.body.user;
    const loginRest = await request(app).post('/api/auth/login').send({
      email: 'rest4@example.com',
      password: 'password123'
    });
    const restCookies = loginRest.headers['set-cookie'];

    const goodRes = await request(app)
      .post('/api/menu')
      .set('Cookie', restCookies)
      .send({
        restaurantId: rest._id,
        name: 'Veggie Wrap',
        price: 7.5
      });

    expect(goodRes.statusCode).toBe(201);
    expect(goodRes.body).toHaveProperty('name', 'Veggie Wrap');
    expect(goodRes.body).toHaveProperty('price', 7.5);
  });
});
