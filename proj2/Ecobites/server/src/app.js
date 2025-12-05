import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import auth from "./routes/auth.routes.js";
import orders from "./routes/orders.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import bidRoutes from './routes/bid.routes.js';

import reviewRoutes from "./routes/review.routes.js";

const app = express();

// CORS configuration allows common local Vite ports for dev convenience
const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5174'
]);
const devPortPattern = /^http:\/\/localhost:51\d{2}$/;

app.use(cors({
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.has(origin) ||
      devPortPattern.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use("/api", routes);
app.use("/api/auth", auth);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orders);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reviews', reviewRoutes);

app.use('/api/profile', profileRoutes);
app.use('/api/bids', bidRoutes);



// Helpful root route so visiting http://localhost:3000/ doesn't show "Cannot GET /"
app.get("/", (req, res) => {
	res.json({
		service: "EcoBites API",
		status: "ok",
		try: {
			health: "/api/health",
			auth: {
				register: "/api/auth/register",
				login: "/api/auth/login",
			},
		},
	});
});

export default app;
