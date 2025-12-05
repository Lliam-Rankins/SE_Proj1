import app from "./app.js";
import { connectDatabase, PORT } from "./config/env.js";
import{ seedData } from "./seed.js";
await connectDatabase();
// await seedData();

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

import authRoutes from './routes/auth.routes.js';
import bidRoutes from './routes/bid.routes.js';
import menuRoutes from './routes/menu.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import profileRoutes from './routes/profile.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';

// Mount all routes (add after middleware, before app.listen)
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/restaurants', restaurantRoutes);