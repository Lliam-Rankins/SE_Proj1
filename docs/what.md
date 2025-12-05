# What: EcoBites Components and Functions

This document provides point descriptions of each class/function in the EcoBites project.

## Backend Models

### User Model (`proj2/Ecobites/server/src/models/User.model.js`)
- **User Schema**: Defines user structure with fields like name, email, password, role (customer/restaurant/driver), address, phone, and role-specific fields.
- **Restaurant Fields**: restaurantName, restaurantImage, cuisine, averageRating, totalReviews, ratingDistribution (breakdown by star rating), detailedRatings (food, service, delivery, value).
- **Driver Fields**: vehicleType, licensePlate, isAvailable.
- **Customer Fields**: rewardPoints (tracks eco-rewards), rewardHistory (array of rewards with amounts, issue dates, and usage status).
- **Preferences**: packaging preference (reusable, compostable, minimal, standard).
- **pre("save") Hook**: Hashes passwords before saving using bcrypt.
- **comparePassword Method**: Compares entered password with stored hash for authentication.

### Order Model (`proj2/Ecobites/server/src/models/Order.model.js`)
- **Order Schema**: Defines order structure with customerId, restaurantId, driverId, items array, status (PLACED to DELIVERED), packagingPreference, ecoRewardPoints, deliveryAddress, pricing fields (subtotal, deliveryFee, tax, total), paymentMethod, specialInstructions, estimatedDeliveryTime, statusHistory.
- **Bidding Fields**: claimedBy (new customer who won bid), claimedVia (BID or DIRECT), originalTotal (original order amount before bid).
- **Combining Fields**: combineGroupId, combineWith (array of related orders).
- **Reward Tracking**: ecoRewardCredited (boolean), driverRewardPoints, driverRewardCredited (boolean).
- **Status Enum**: Supports both uppercase (PLACED) and lowercase (placed) variants for compatibility.
- **pre("validate") Hook**: Auto-generates unique orderNumber (e.g., ORD000001) on creation.

### MenuItem Model (`proj2/Ecobites/server/src/models/MenuItem.model.js`)
- **MenuItem Schema**: Defines menu item structure with restaurantId, name, description, price, category (appetizer/main/dessert/beverage/side), image, isAvailable, preparationTime, packagingOptions (reusable/compostable/minimal).
- **Seasonal Fields**: isSeasonal (boolean, default false), seasonalLabel (string for theme), seasonalRewardPoints (bonus eco-points for ordering seasonal items).

### Bid Model (`proj2/Ecobites/server/src/models/Bid.model.js`)
- **Bid Schema**: Defines bidding structure with orderId (reference to cancelled order), bidderId (customer placing bid), bidAmount (minimum 0), status (PENDING/ACCEPTED/REJECTED/EXPIRED), message (optional note, max 500 chars).
- **Address Fields**: deliveryAddress (new customer's address with coordinates).
- **Payment**: paymentMethod (cash/card/online).
- **Expiration**: expiresAt (date when bid expires).
- **Indexes**: Compound indexes on orderId+status, bidderId+status, and expiresAt for efficient queries.
- **Pre-save Middleware**: Verifies order exists and is cancelled before allowing bid creation.

### Review Model (`proj2/Ecobites/server/src/models/Review.model.js`)
- **Review Schema**: Defines review structure with restaurantId, customerId, orderId (optional, for verified reviews), rating (1-5 required), comment (optional, max 1000 chars).
- **Detailed Ratings**: Optional breakdown for food, service, delivery, value (each 1-5).
- **Response Field**: Restaurant owner can respond with text and timestamp.
- **Engagement**: helpfulCount (number), helpfulBy (array of user IDs who marked helpful).
- **Moderation**: flagged (boolean), flaggedBy (array with userId, reason, timestamp).
- **Verification**: verified (boolean, auto-set if linked to delivered order).
- **Indexes**: Compound unique index on restaurantId+customerId (one review per customer per restaurant), compound index on restaurantId+rating.
- **Pre-save Middleware**: Auto-verifies review if linked to a delivered order.
- **Static Method updateRestaurantRating**: Calculates and updates restaurant's aggregate ratings using MongoDB aggregation pipeline.
- **Instance Methods**: markHelpful(userId), unmarkHelpful(userId) for managing helpful votes.

## Backend Controllers

### Auth Controller (`proj2/Ecobites/server/src/controller/auth.controller.js`)
- **register Function**: Handles user registration, validates input, checks for existing email, creates user with role-specific fields, generates JWT token, returns user data.
- **login Function**: Handles user login, validates credentials, compares password hash, generates JWT token, returns user data with preferences and ratings.
- **logout Function**: Handles user logout, clears authentication tokens/cookies.
- **me Function**: Returns current authenticated user's profile data including preferences, reward history, and ratings.

### Orders Controller (`proj2/Ecobites/server/src/controller/orders.controller.js`)
- **createOrder Function**: Creates new order, validates items belong to same restaurant, calculates subtotal/total, applies eco-rewards based on packaging preference and seasonal items, saves order with status history.
- **getOrdersByRole Function**: Retrieves orders filtered by user role (customer/restaurant/driver), populates restaurant name and pickup address for drivers.
- **getOrderById Function**: Retrieves single order by ID with full details.
- **updateOrderStatus Function**: Updates order status with authorization checks (customers can cancel, restaurants can prepare, drivers can deliver), credits eco-rewards on delivery, awards driver incentives based on vehicle type.
- **getAvailableOrdersForDrivers Function**: Returns READY and COMBINED orders without assigned drivers for driver pickup.
- **combineOrdersWithNeighbors Function**: Finds nearby orders within specified radius (default 500m), combines them for delivery optimization, awards +20 eco-points to participating customers.

### Menu Controller (`proj2/Ecobites/server/src/controller/menu.controller.js`)
- **createMenuItem Function**: Creates new menu item for restaurant, validates restaurant ownership, supports seasonal item fields (isSeasonal, seasonalLabel, seasonalRewardPoints).
- **getMenuByRestaurant Function**: Retrieves all available menu items for specified restaurant, sorted by category and name.
- **getSeasonalByRestaurant Function**: Retrieves only seasonal items (isSeasonal: true) for a specific restaurant, sorted by most recently updated.
- **getSeasonalAll Function**: Retrieves up to 20 seasonal items across all restaurants, sorted by most recently created.
- **updateMenuItem Function**: Updates menu item details, validates restaurant ownership, allows updating seasonal status and reward points.
- **deleteMenuItem Function**: Removes menu item, validates restaurant ownership.

### Restaurant Controller (`proj2/Ecobites/server/src/controller/restaurant.controller.js`)
- **getAllRestaurants Function**: Retrieves all users with restaurant role, includes ratings and review statistics, sorted by restaurant name.
- **getRestaurantById Function**: Retrieves specific restaurant by ID with full profile including ratings distribution and detailed ratings.

### Profile Controller (`proj2/Ecobites/server/src/controller/profile.controller.js`)
- **updateAddress Function**: Updates user's address and geocodes it to get coordinates, saves to user profile.
- **geocodeOnly Function**: Geocodes an address without saving to profile (for one-time order deliveries).
- **updateRewardPoints Function**: Updates user's reward points balance, adds entry to rewardHistory.
- **markRewardUsed Function**: Marks a specific reward in user's rewardHistory as used.
- **updatePreferences Function**: Updates user preferences (currently supports packaging preference).

### Bid Controller (`proj2/Ecobites/server/src/controller/bid.controller.js`)
- **getAvailableCancelledOrders Function**: Retrieves all cancelled orders that are available for bidding.
- **placeBid Function**: Creates new bid on a cancelled order, validates order exists and is cancelled, sets expiration time (default 24 hours), saves with bidder's delivery address.
- **getBidsForOrder Function**: Retrieves all bids for a specific order (only accessible to original order customer).
- **getMyBids Function**: Retrieves current user's bids with populated order and restaurant details.
- **acceptBid Function**: Accepts a bid (original customer only), updates order with new customer (claimer), changes order total to bid amount, rejects all other pending bids, resets order status to PLACED.
- **rejectBid Function**: Rejects a bid, updates bid status to REJECTED.
- **cancelBid Function**: Allows bidder to cancel their own pending bid.

### Review Controller (`proj2/Ecobites/server/src/controller/review.controller.js`)
- **createReview Function**: Creates new review for restaurant, validates no duplicate reviews (one per customer per restaurant), auto-verifies if linked to delivered order, triggers updateRestaurantRating.
- **getReviewsByRestaurant Function**: Retrieves all reviews for a restaurant with pagination and sorting options (newest, highest, lowest, helpful), populates customer name.
- **getMyReviews Function**: Retrieves current customer's reviews across all restaurants.
- **updateReview Function**: Updates existing review (customer only, must be author), triggers updateRestaurantRating.
- **deleteReview Function**: Deletes review (customer only, must be author), triggers updateRestaurantRating.
- **respondToReview Function**: Allows restaurant owner to respond to a review with text and timestamp.
- **markReviewHelpful Function**: Toggles helpful status for a review (marks if not marked, unmarks if already marked), updates helpfulCount.

### Health Controller (`proj2/Ecobites/server/src/controller/healthController.js`)
- **getHealth Function**: Returns server status and health message for monitoring.

## Backend Middleware

### Auth Middleware (`proj2/Ecobites/server/src/middleware/auth.middleware.js`)
- **protect Function**: Verifies JWT token from Authorization header or cookies, decodes user information, sets req.user for downstream handlers.
- **authorize Function**: Checks user role against required roles array, returns 403 if unauthorized.

## Backend Routes

### Auth Routes (`proj2/Ecobites/server/src/routes/auth.routes.js`)
- POST /auth/register: User registration
- POST /auth/login: User authentication
- POST /auth/logout: User logout
- GET /auth/me: Get current user profile (protected)

### Profile Routes (`proj2/Ecobites/server/src/routes/profile.routes.js`)
- POST /profile/geocode: Geocode address without saving (protected)
- POST /profile/address: Update address with geocoding (protected)
- POST /profile/preferences: Update user preferences (protected)
- PATCH /profile/users/:userId/points: Update reward points (protected)
- PATCH /profile/users/:userId/rewards/:rewardId/use: Mark reward as used (protected)

### Restaurant Routes (`proj2/Ecobites/server/src/routes/restaurant.routes.js`)
- GET /restaurants: Get all restaurants
- GET /restaurants/:id: Get restaurant by ID

### Menu Routes (`proj2/Ecobites/server/src/routes/menu.routes.js`)
- POST /menu: Create menu item (restaurant only, protected)
- GET /menu/restaurant/:restaurantId: Get restaurant's menu
- GET /menu/restaurant/:restaurantId/seasonal: Get seasonal items for restaurant
- GET /menu/seasonal: Get all seasonal items
- PUT /menu/:id: Update menu item (restaurant only, protected)
- DELETE /menu/:id: Delete menu item (restaurant only, protected)

### Order Routes (`proj2/Ecobites/server/src/routes/orders.routes.js`)
- POST /orders: Create order (protected)
- POST /orders/combine: Combine orders with neighbors (protected)
- GET /orders/available/drivers: Get available orders for drivers (protected)
- GET /orders/detail/:orderId: Get order by ID (protected)
- GET /orders/:role/:userId: Get orders by role (protected)
- PATCH /orders/:orderId/status: Update order status (protected)
- PUT /orders/:orderId/status: Update order status (alternative, protected)

### Bid Routes (`proj2/Ecobites/server/src/routes/bid.routes.js`)
- GET /bids/cancelled-orders: Get available cancelled orders (protected)
- POST /bids: Place bid on cancelled order (protected)
- GET /bids/my-bids: Get current user's bids (protected)
- GET /bids/order/:orderId: Get bids for specific order (protected)
- POST /bids/:bidId/accept: Accept a bid (protected)
- POST /bids/:bidId/reject: Reject a bid (protected)
- DELETE /bids/:bidId: Cancel own bid (protected)

### Review Routes (`proj2/Ecobites/server/src/routes/review.routes.js`)
- GET /reviews/my-reviews: Get current user's reviews (customer only, protected)
- GET /reviews/restaurant/:restaurantId: Get restaurant's reviews (public)
- POST /reviews: Create review (customer only, protected)
- POST /reviews/:reviewId/helpful: Mark review as helpful (protected)
- POST /reviews/:reviewId/response: Restaurant responds to review (restaurant only, protected)
- PUT /reviews/:reviewId: Update own review (customer only, protected)
- DELETE /reviews/:reviewId: Delete own review (customer only, protected)

## Frontend Components

### App Component (`proj2/Ecobites/client/src/App.jsx`)
- **Main Application Router**: Defines all routes using React Router, wraps app in RestaurantProvider and AuthProvider contexts.
- **Public Routes**: /login, /about (accessible without authentication).
- **Protected Routes**: All other routes require authentication.
- **ProtectedRoute Component**: Checks login status before rendering protected routes.
- **RoleBasedRoute Component**: Enforces role-specific access (customer, restaurant, driver dashboards).

### Login Component (`proj2/Ecobites/client/src/pages/login.jsx`)
- **Authentication UI**: Handles both login and registration forms with toggle between modes.
- **Registration Fields**: Name, email, phone, password, role selection, and role-specific fields (restaurant name/cuisine for restaurants, vehicle type/license plate for drivers).
- **Validation**: Client-side validation for required fields and password length.
- **API Integration**: Calls auth.service register/login functions.
- **Navigation**: Redirects to role-specific dashboards after successful authentication.

### Customer Component (`proj2/Ecobites/client/src/customers/Customer.jsx`)
- **Restaurant Discovery**: Fetches and displays restaurants with ratings, reviews, and cuisine filters.
- **Menu Viewing**: Displays menu items when restaurant selected, shows seasonal badges and reward points.
- **Seasonal Banner**: Dismissible post-login banner encouraging seasonal highlights exploration.
- **Cart Management**: Add items to cart, adjust quantities, view totals, proceed to checkout.
- **Search/Filter**: Filter restaurants by cuisine type, search by name.
- **State Management**: Uses RestaurantContext for data, local state for cart and UI.

### Drivers Component (`proj2/Ecobites/client/src/drivers/Drivers.jsx`)
- **Order Dashboard**: Tabbed interface showing available, current, and past orders.
- **Order Acceptance**: Accept available READY orders, auto-assigns driver to order.
- **Status Updates**: Update order status through delivery workflow (picked up, out for delivery, delivered).
- **Location Sharing**: Geolocation feature to share current location with customers.
- **Eco-Rewards Display**: Shows driver incentives based on vehicle type, earned points, performance metrics.
- **Reviews & Insights**: Displays customer reviews, performance analytics, efficiency metrics.

### Restaurants Component (`proj2/Ecobites/client/src/restaurants/Restaurants.jsx`)
- **Dashboard Overview**: Navigation hub for restaurant operations.
- **Menu Management**: Link to menu items page for CRUD operations.
- **Order Handling**: Link to customer orders page for order fulfillment.
- **Review Management**: Link to reviews page (if implemented).

### Menu Items Component (`proj2/Ecobites/client/src/restaurants/MenuItems.jsx`)
- **Menu Display**: Shows current menu items with edit/delete controls, seasonal badges, reward points.
- **Add Item Form**: Modal/form for creating new items with validation.
- **Seasonal Management**: Checkbox to mark items as seasonal, input for bonus reward points, label input.
- **Edit Functionality**: Inline editing for existing items including seasonal status.
- **Category Selection**: Dropdown for item categories (appetizer, main, dessert, beverage, side).
- **Packaging Options**: Multi-select checkboxes for packaging types.

### Customer Orders Component (`proj2/Ecobites/client/src/restaurants/CustomerOrders.jsx`)
- **Order List**: Displays incoming orders with status indicators and timestamps.
- **Status Updates**: Buttons to progress orders (accept, prepare, ready).
- **Order Details**: Expandable view with items, customer info, special instructions.
- **Real-time Updates**: Polls for new orders and status changes.

### Checkout Component (`proj2/Ecobites/client/src/customers/Checkout.jsx`)
- **Order Summary**: Cart items, quantities, prices, subtotals.
- **Packaging Selection**: Radio buttons with eco-points display for each option.
- **Address Input**: Form fields for delivery address with validation.
- **Special Instructions**: Text area for delivery notes.
- **Payment Method**: Selection between cash, card, online.
- **Order Placement**: Submit button validates and creates order via API.

### Order Detail Component (`proj2/Ecobites/client/src/customers/OrderDetail.jsx`)
- **Order Tracking**: Current status with progress indicator/timeline.
- **Order Information**: Items ordered, pricing breakdown, delivery address.
- **Status History**: Timeline of status changes with timestamps and actors.
- **Driver Info**: Shows assigned driver details when available.
- **Actions**: Cancel order (if eligible), combine with neighbors, contact support.

### Order Status Component (`proj2/Ecobites/client/src/customers/OrderStatus.jsx`)
- **Status Display**: Visual representation of current order status.
- **Real-time Updates**: Polls API for status changes at regular intervals.
- **Action Buttons**: Context-aware buttons (cancel if eligible, track driver, etc.).

### Profile Component (`proj2/Ecobites/client/src/pages/Profile.jsx`)
- **User Information**: Display and edit profile fields.
- **Eco-Rewards Balance**: Shows accumulated points and history.
- **Order History**: Links to past orders with filters.
- **Account Settings**: Password change, notification preferences, packaging preference.
- **Review History**: Links to user's submitted reviews (for customers).

## Frontend Services

### Auth Service (`proj2/Ecobites/client/src/api/services/auth.service.js`)
- **register Function**: POST /api/auth/register with user data, stores token.
- **login Function**: POST /api/auth/login, stores JWT token in localStorage/cookies.
- **getProfile Function**: GET /api/auth/me for current user data.
- **logout Function**: POST /api/auth/logout, clears stored tokens, redirects to login.

### Menu Service (`proj2/Ecobites/client/src/api/services/menu.service.js`)
- **getByRestaurant Function**: GET /api/menu/restaurant/:id.
- **getSeasonalByRestaurant Function**: GET /api/menu/restaurant/:id/seasonal.
- **getSeasonalAll Function**: GET /api/menu/seasonal.
- **create Function**: POST /api/menu with item data including seasonal fields.
- **update Function**: PUT /api/menu/:id with updates.
- **delete Function**: DELETE /api/menu/:id.

### Order Service (`proj2/Ecobites/client/src/api/services/order.service.js`)
- **createOrder Function**: POST /api/orders with order data.
- **getOrdersByRole Function**: GET /api/orders/:role/:userId.
- **getOrderById Function**: GET /api/orders/detail/:orderId.
- **updateOrderStatus Function**: PATCH /api/orders/:orderId/status.
- **getAvailableOrders Function**: GET /api/orders/available/drivers.
- **combineOrders Function**: POST /api/orders/combine with radius parameter.

### Restaurant Service (`proj2/Ecobites/client/src/api/services/restaurant.service.js`)
- **getAllRestaurants Function**: GET /api/restaurants with ratings and reviews.
- **getRestaurantById Function**: GET /api/restaurants/:id.

### Profile Service (`proj2/Ecobites/client/src/api/services/profile.service.js`)
- **updateAddress Function**: POST /api/profile/address with street, city, zipCode.
- **geocodeAddress Function**: POST /api/profile/geocode for coordinate lookup.
- **updatePreferences Function**: POST /api/profile/preferences with packaging preference.
- **updateRewardPoints Function**: PATCH /api/profile/users/:userId/points.
- **markRewardUsed Function**: PATCH /api/profile/users/:userId/rewards/:rewardId/use.

### Bid Service (`proj2/Ecobites/client/src/api/services/bid.service.js`)
- **getCancelledOrders Function**: GET /api/bids/cancelled-orders.
- **placeBid Function**: POST /api/bids with orderId, bidAmount, message, deliveryAddress.
- **getMyBids Function**: GET /api/bids/my-bids.
- **getBidsForOrder Function**: GET /api/bids/order/:orderId.
- **acceptBid Function**: POST /api/bids/:bidId/accept.
- **rejectBid Function**: POST /api/bids/:bidId/reject.
- **cancelBid Function**: DELETE /api/bids/:bidId.

### Review Service (`proj2/Ecobites/client/src/api/services/review.service.js`)
- **createReview Function**: POST /api/reviews with restaurantId, rating, comment, detailed ratings.
- **getReviewsByRestaurant Function**: GET /api/reviews/restaurant/:restaurantId with pagination.
- **getMyReviews Function**: GET /api/reviews/my-reviews.
- **updateReview Function**: PUT /api/reviews/:reviewId.
- **deleteReview Function**: DELETE /api/reviews/:reviewId.
- **respondToReview Function**: POST /api/reviews/:reviewId/response.
- **markHelpful Function**: POST /api/reviews/:reviewId/helpful.

## Frontend Contexts

### Auth Context (`proj2/Ecobites/client/src/context/AuthContext.jsx`)
- **State Management**: Stores user data, authentication status, JWT token, preferences.
- **Login/Logout Functions**: Handles authentication flow, token storage, user state updates.
- **Role-based Access**: Provides user role for conditional rendering.
- **Profile Updates**: Handles user profile and preference updates.

### Cart Context (`proj2/Ecobites/client/src/context/CartContext.jsx`)
- **Cart State**: Items, quantities, totals, selected packaging preference.
- **CRUD Operations**: Add/remove items, update quantities, clear cart.
- **Persistence**: Saves cart to localStorage for session persistence.
- **Calculations**: Computes subtotals, eco-points, totals.

### Restaurant Context (`proj2/Ecobites/client/src/context/RestaurantContext.jsx`)
- **Restaurant Data**: Selected restaurant, menu items, ratings, reviews.
- **Search/Filter**: Functions for finding restaurants by cuisine, rating, location.
- **Menu Loading**: Fetches and caches menu data on restaurant selection.

## Frontend Hooks

### useAuth (`proj2/Ecobites/client/src/hooks/useAuth.js`)
- **Authentication State**: Returns current user, login status, preferences.
- **Auth Actions**: Provides login, logout, register, updateProfile functions.

### useAuthContext (`proj2/Ecobites/client/src/hooks/useAuthContext.js`)
- **Context Access**: Simplified hook to access AuthContext values.

### useMenu (`proj2/Ecobites/client/src/hooks/useMenu.js`)
- **Menu Data**: Fetches and caches menu items for restaurant.
- **CRUD Operations**: Create, update, delete menu items with API integration.
- **Seasonal Filtering**: Functions to filter seasonal items.

### useOrders (`proj2/Ecobites/client/src/hooks/useOrders.js`)
- **Order Management**: Fetches user orders by role, handles status updates.
- **Real-time Updates**: Polling mechanism for order status changes.
- **Order Actions**: Cancel, combine, track orders.

### useRestaurant (`proj2/Ecobites/client/src/hooks/useRestaurant.js`)
- **Restaurant Data**: Fetches restaurant list with ratings and details.
- **Search Functionality**: Filters restaurants by multiple criteria.

## Frontend Utilities

### Constants (`proj2/Ecobites/client/src/utils/constants.js`)
- **API Base URL**: Centralized API endpoint configuration.
- **Order Statuses**: Complete list of valid order statuses.
- **Eco-Rewards**: Point values for packaging, seasonal items, combinations.
- **Bid Expiration**: Default bid expiration times.

### Helpers (`proj2/Ecobites/client/src/utils/helpers.js`)
- **Format Currency**: Formats prices for display with locale settings.
- **Calculate Distance**: Haversine formula for coordinate distance calculation.
- **Validate Email**: Email format validation utility.
- **Date Formatting**: Formats timestamps for display.

### Validators (`proj2/Ecobites/client/src/utils/validators.js`)
- **Form Validation**: Validates user input across registration, orders, reviews.
- **Address Validation**: Checks delivery address completeness.
- **Phone Validation**: Phone number format checking.
- **Rating Validation**: Ensures ratings are 1-5 range.

## Frontend Tests

### Component Tests
- **Login Test** (`Login.test.jsx`): Registration flow, login functionality, validation, role-specific fields.
- **MenuItems Test** (`MenuItems.test.jsx`): CRUD operations, seasonal toggles, packaging options, form validation.
- **Order Detail Test** (`OrderDetail.test.jsx`): Order display, combine functionality, status tracking.
- **Order Status Test** (`OrderStatus.test.jsx`): Status updates, real-time polling, action buttons.
- **Customer Orders Test** (`CustomerOrders.test.jsx`): Restaurant order management, status progression.
- **Drivers Test** (`Drivers.test.jsx`): Driver dashboard, order acceptance, status updates, location sharing.
- **Combine Orders Test** (`CombineOrders.test.jsx`): Neighbor finding, order combination, eco-points award.

### Service Tests
- **Auth Service Tests** (`auth.service.test.js`): Registration, login, profile fetch, logout.
- **Order Service Tests** (`order.service.test.js`): Order creation, status updates, role-based retrieval.
- **Bid Service Tests** (`bid.service.test.js`): Bid placement, acceptance, rejection, cancellation.
- **Review Service Tests** (`review.service.test.js`): Review CRUD, helpful marking, restaurant responses.

## Backend Configuration

### Constants (`proj2/Ecobites/server/src/config/constants.js`)
- **Eco-Rewards Calculation**: Functions for packaging and driver incentive points.
- **Order Statuses**: Valid order status values and transitions.
- **Packaging Options**: Available packaging preferences with point values.
- **Bid Expiration**: Default expiration periods for bids.

### Environment Configuration (`proj2/Ecobites/server/src/config/env.js`)
- **Database Connection**: Establishes MongoDB connection with Mongoose.
- **Environment Variables**: Loads and validates MONGODB_URI, JWT_SECRET, PORT, NODE_ENV.
- **Geocoding API**: Configuration for address geocoding service.

## Testing Infrastructure

### Setup (`proj2/Ecobites/client/src/setupTests.js`)
- **Jest DOM**: Imports @testing-library/jest-dom matchers.
- **MongoDB Memory Server**: In-memory database for testing.
- **Database Helpers**: connectDB, closeDB, clearDB functions for test lifecycle.

### Unit Tests (`proj2/Ecobites/server/tests/unit/`)
- **User Model Test**: Password hashing, validation, comparePassword method.
- **Order Model Test**: Order number generation, status transitions.
- **Bid Model Test**: Bid creation, expiration, status updates.
- **Review Model Test**: Rating aggregation, helpful marking, verification.

### Integration Tests (`proj2/Ecobites/server/tests/integration/`)
- **Auth Tests** (`auth.test.mjs`): Registration, login, JWT middleware.
- **Orders Tests** (`orders.test.mjs`, `orders.combined.test.mjs`): Order workflow, combination logic.
- **Bids Tests** (`bids.test.mjs`): Complete bidding workflow from placement to acceptance.
- **Reviews Tests** (`reviews.test.mjs`): Review CRUD, rating aggregation, responses.

## Package Scripts

### Server Scripts
- **start**: Runs server with nodemon for development auto-reload.
- **dev**: Alternative development server command.
- **test**: Runs Jest tests with coverage report.
- **test:watch**: Runs tests in watch mode for development.
- **seed**: Seeds database with sample data for testing.

### Client Scripts
- **dev**: Starts Vite development server with hot module replacement.
- **build**: Builds optimized production bundle.
- **test**: Runs Vitest tests.
- **test:coverage**: Runs tests with coverage report.
- **preview**: Previews production build locally.
