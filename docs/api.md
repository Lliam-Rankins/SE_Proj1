# EcoBites API Documentation

This document provides comprehensive documentation for the EcoBites REST API, including all endpoints, request/response formats, authentication requirements, and usage examples.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- `customer`: Can place orders, view their orders, write reviews, place bids
- `restaurant`: Can manage menu items, update order status, respond to reviews
- `driver`: Can view available orders, update delivery status

---

## Endpoints

### Health Check

#### GET /health

Returns the server health status.

**Authentication:** None required

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running fine!"
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Authentication:** None required

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required, min 6 chars)",
  "phone": "string (optional)",
  "role": "customer|restaurant|driver (required)",
  "address": {
    "street": "string",
    "city": "string",
    "zipCode": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  // Restaurant-specific fields (if role === 'restaurant')
  "restaurantName": "string (required if role is restaurant)",
  "restaurantImage": "string (optional)",
  "cuisine": ["string"] (required if role is restaurant),
  // Driver-specific fields (if role === 'driver')
  "vehicleType": "gas|electric|hybrid (required if role is driver)",
  "licensePlate": "string (required if role is driver)"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-string",
  "user": {
    "id": "string",
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "rewardPoints": 0,
    "rewardHistory": [],
    "vehicleType": null,
    "licensePlate": null,
    "restaurantName": null,
    "restaurantImage": null,
    "cuisine": null,
    "averageRating": 0,
    "totalReviews": 0
  }
}
```

**Error Responses:**
- 400: Missing required fields, password too short, email already registered
- 500: Server error

### POST /auth/login

Authenticate user and return JWT token.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt-token-string",
  "user": {
    "id": "string",
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "rewardPoints": 0,
    "rewardHistory": [],
    "preferences": {
      "packaging": "standard"
    }
  }
}
```

**Error Responses:**
- 400: Missing email or password
- 401: Invalid credentials
- 500: Server error

### POST /auth/logout

Logout current user.

**Authentication:** Required (any role)

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### GET /auth/me

Get current authenticated user's profile.

**Authentication:** Required (any role)

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "rewardPoints": 0,
    "rewardHistory": [],
    "averageRating": 4.5,
    "totalReviews": 23,
    "ratingDistribution": {
      "5": 15,
      "4": 5,
      "3": 2,
      "2": 1,
      "1": 0
    }
  }
}
```

---

## Profile Management Endpoints

### POST /profile/address

Update user's delivery address with geocoding.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "street": "string (required)",
  "city": "string (required)",
  "zipCode": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Address updated successfully",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zipCode": "12345",
    "coordinates": {
      "lat": 35.7796,
      "lng": -78.6382
    }
  }
}
```

### POST /profile/geocode

Geocode an address without saving to profile (for one-time orders).

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "street": "string (required)",
  "city": "string (required)",
  "zipCode": "string (required)"
}
```

**Response (200):**
```json
{
  "coordinates": {
    "lat": 35.7796,
    "lng": -78.6382
  }
}
```

### POST /profile/preferences

Update user preferences.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "packaging": "reusable|compostable|minimal|standard"
}
```

**Response (200):**
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "packaging": "reusable"
  }
}
```

### PATCH /profile/users/:userId/points

Update user's reward points.

**Authentication:** Required (must be self or admin)

**Request Body:**
```json
{
  "points": "number (amount to add/subtract)"
}
```

**Response (200):**
```json
{
  "message": "Reward points updated",
  "rewardPoints": 150
}
```

### PATCH /profile/users/:userId/rewards/:rewardId/use

Mark a reward as used.

**Authentication:** Required (must be self)

**Response (200):**
```json
{
  "message": "Reward marked as used",
  "reward": {
    "amount": 50,
    "issuedAt": "2024-01-01T12:00:00.000Z",
    "used": true
  }
}
```

---

## Restaurant Endpoints

### GET /restaurants

Get all restaurants.

**Authentication:** None required

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "restaurant-id",
      "name": "Restaurant Name",
      "email": "restaurant@example.com",
      "role": "restaurant",
      "restaurantName": "Mario's Pizzeria",
      "restaurantImage": "https://example.com/image.jpg",
      "cuisine": ["Italian", "Pizza"],
      "averageRating": 4.5,
      "totalReviews": 23,
      "ratingDistribution": {
        "5": 15,
        "4": 5,
        "3": 2,
        "2": 1,
        "1": 0
      },
      "detailedRatings": {
        "food": 4.6,
        "service": 4.4,
        "delivery": 4.5,
        "value": 4.3
      },
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "zipCode": "12345"
      },
      "phone": "+1234567890"
    }
  ]
}
```

### GET /restaurants/:id

Get restaurant by ID.

**Authentication:** None required

**Parameters:**
- `id` (path): Restaurant ID

**Response (200):** Same structure as single restaurant in GET /restaurants

**Error Responses:**
- 404: Restaurant not found
- 500: Server error

---

## Menu Item Endpoints

### POST /menu

Create a new menu item (restaurant only).

**Authentication:** Required (restaurant role)

**Request Body:**
```json
{
  "restaurantId": "string (optional, defaults to authenticated restaurant)",
  "name": "string (required)",
  "description": "string",
  "price": "number (required)",
  "category": "appetizer|main|dessert|beverage|side",
  "image": "string (URL)",
  "preparationTime": "number (minutes)",
  "packagingOptions": ["reusable", "compostable", "minimal"],
  "isSeasonal": "boolean (default: false)",
  "seasonalLabel": "string (e.g., 'Halloween', 'Christmas')",
  "seasonalRewardPoints": "number (default: 0)"
}
```

**Response (201):**
```json
{
  "_id": "menu-item-id",
  "restaurantId": "restaurant-id",
  "name": "Margherita Pizza",
  "description": "Classic tomato and mozzarella",
  "price": 12.99,
  "category": "main",
  "image": "https://example.com/pizza.jpg",
  "isAvailable": true,
  "preparationTime": 15,
  "packagingOptions": ["reusable", "compostable"],
  "isSeasonal": false,
  "seasonalLabel": "",
  "seasonalRewardPoints": 0
}
```

### GET /menu/restaurant/:restaurantId

Get menu items for a restaurant.

**Authentication:** None required

**Parameters:**
- `restaurantId` (path): Restaurant ID

**Response (200):** Array of menu items

### GET /menu/restaurant/:restaurantId/seasonal

Get seasonal menu items for a restaurant.

**Authentication:** None required

**Response (200):** Array of seasonal menu items

### GET /menu/seasonal

Get all seasonal menu items across all restaurants (up to 20 items).

**Authentication:** None required

**Response (200):** Array of up to 20 seasonal menu items

### PUT /menu/:id

Update a menu item (restaurant only).

**Authentication:** Required (restaurant role)

**Parameters:**
- `id` (path): Menu item ID

**Request Body:** Same as POST, all fields optional

**Response (200):** Updated menu item

### DELETE /menu/:id

Delete a menu item (restaurant only).

**Authentication:** Required (restaurant role)

**Response (200):**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

---

## Order Endpoints

### POST /orders

Create a new order (customer only).

**Authentication:** Required (customer role)

**Request Body:**
```json
{
  "customerId": "string (optional, defaults to authenticated user)",
  "restaurantId": "string (optional, derived from items)",
  "items": [
    {
      "menuItemId": "string (required)",
      "quantity": "number (default: 1)"
    }
  ],
  "deliveryAddress": {
    "street": "string",
    "city": "string",
    "zipCode": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "packagingPreference": "reusable|compostable|minimal|standard (default: standard)",
  "specialInstructions": "string",
  "paymentMethod": "cash|card|online (default: card)"
}
```

**Response (201):** Order object with status "PLACED"

### GET /orders/:role/:userId

Get orders by role and user ID.

**Authentication:** Required (must match userId)

**Parameters:**
- `role` (path): customer|restaurant|driver
- `userId` (path): User ID

**Response (200):** Array of orders

### GET /orders/detail/:orderId

Get order by ID.

**Authentication:** Required (any role)

**Response (200):** Single order object

### GET /orders/available/drivers

Get available orders for drivers (READY status without assigned driver).

**Authentication:** Required (driver role only)

**Response (200):** Array of available orders

### PATCH /orders/:orderId/status

Update order status.

**Authentication:** Required (role-based permissions)

**Request Body:**
```json
{
  "status": "CANCELLED|ACCEPTED|PREPARING|READY|DRIVER_ASSIGNED|PICKED_UP|OUT_FOR_DELIVERY|DELIVERED",
  "driverId": "string (optional, for DRIVER_ASSIGNED)"
}
```

**Response (200):** Updated order object

**Status Update Permissions:**
- `CANCELLED`: Only customer who placed the order
- `ACCEPTED|PREPARING|READY`: Only restaurant that owns the order
- `DRIVER_ASSIGNED|PICKED_UP|OUT_FOR_DELIVERY|DELIVERED`: Only drivers

### PUT /orders/:orderId/status

Same as PATCH above (for compatibility).

### POST /orders/combine

Combine orders with nearby customers for delivery optimization.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "customerId": "string (required)",
  "radiusMeters": "number (default: 500)"
}
```

**Response (200):**
```json
{
  "message": "Orders combined! Both you and your neighbors earned 20 eco points.",
  "combinedOrders": [],
  "updatedOrderIds": []
}
```

---

## Bidding System Endpoints

### GET /bids/cancelled-orders

Get all cancelled orders available for bidding.

**Authentication:** Required (any role)

**Response (200):**
```json
[
  {
    "_id": "order-id",
    "orderNumber": "ORD000001",
    "restaurantId": "restaurant-id",
    "items": [],
    "deliveryAddress": {},
    "total": 25.99,
    "originalTotal": 25.99,
    "status": "CANCELLED",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### POST /bids

Place a bid on a cancelled order.

**Authentication:** Required (customer role)

**Request Body:**
```json
{
  "orderId": "string (required)",
  "bidAmount": "number (required, min: 0)",
  "message": "string (optional, max 500 chars)",
  "deliveryAddress": {
    "street": "string (required)",
    "city": "string (required)",
    "zipCode": "string (required)",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "paymentMethod": "cash|card|online (default: card)"
}
```

**Response (201):**
```json
{
  "_id": "bid-id",
  "orderId": "order-id",
  "bidderId": "customer-id",
  "bidAmount": 20.00,
  "status": "PENDING",
  "message": "I'd like to take this order",
  "deliveryAddress": {},
  "paymentMethod": "card",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

### GET /bids/my-bids

Get current user's bids.

**Authentication:** Required (customer role)

**Response (200):** Array of user's bids

### GET /bids/order/:orderId

Get all bids for a specific order (for original customer).

**Authentication:** Required (must be original order customer)

**Response (200):** Array of bids for the order

### POST /bids/:bidId/accept

Accept a bid (original customer only).

**Authentication:** Required (must be original order customer)

**Response (200):**
```json
{
  "message": "Bid accepted successfully",
  "bid": {},
  "order": {}
}
```

**Note:** Accepting a bid:
- Updates bid status to "ACCEPTED"
- Rejects all other pending bids for that order
- Updates order with new customer (claimer)
- Sets order status to "PLACED"
- Updates order total to bid amount

### POST /bids/:bidId/reject

Reject a bid (original customer only).

**Authentication:** Required (must be original order customer)

**Response (200):**
```json
{
  "message": "Bid rejected",
  "bid": {}
}
```

### DELETE /bids/:bidId

Cancel own bid.

**Authentication:** Required (must be bid creator)

**Response (200):**
```json
{
  "message": "Bid cancelled",
  "bid": {}
}
```

---

## Review System Endpoints

### POST /reviews

Create a review for a restaurant.

**Authentication:** Required (customer role)

**Request Body:**
```json
{
  "restaurantId": "string (required)",
  "orderId": "string (optional, for verified reviews)",
  "rating": "number (required, 1-5)",
  "comment": "string (optional, max 1000 chars)",
  "ratings": {
    "food": "number (optional, 1-5)",
    "service": "number (optional, 1-5)",
    "delivery": "number (optional, 1-5)",
    "value": "number (optional, 1-5)"
  }
}
```

**Response (201):**
```json
{
  "_id": "review-id",
  "restaurantId": "restaurant-id",
  "customerId": "customer-id",
  "orderId": "order-id",
  "rating": 5,
  "comment": "Excellent food and service!",
  "ratings": {
    "food": 5,
    "service": 5,
    "delivery": 4,
    "value": 5
  },
  "verified": true,
  "helpfulCount": 0,
  "flagged": false,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Note:** Reviews are automatically marked as verified if linked to a delivered order.

### GET /reviews/restaurant/:restaurantId

Get all reviews for a restaurant (public endpoint).

**Authentication:** None required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Reviews per page (default: 10)
- `sort`: Sort order (newest|highest|lowest|helpful) (default: newest)

**Response (200):**
```json
{
  "reviews": [],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### GET /reviews/my-reviews

Get current user's reviews.

**Authentication:** Required (customer role)

**Response (200):** Array of user's reviews

### PUT /reviews/:reviewId

Update own review.

**Authentication:** Required (customer role, must be review author)

**Request Body:** Same as POST, all fields optional

**Response (200):** Updated review object

### DELETE /reviews/:reviewId

Delete own review.

**Authentication:** Required (customer role, must be review author)

**Response (200):**
```json
{
  "message": "Review deleted successfully"
}
```

**Note:** Deleting a review automatically updates the restaurant's aggregate rating.

### POST /reviews/:reviewId/response

Restaurant owner responds to a review.

**Authentication:** Required (restaurant role, must be reviewed restaurant)

**Request Body:**
```json
{
  "text": "string (required, max 1000 chars)"
}
```

**Response (200):**
```json
{
  "message": "Response added successfully",
  "review": {
    "_id": "review-id",
    "response": {
      "text": "Thank you for your feedback!",
      "respondedAt": "2024-01-01T13:00:00.000Z"
    }
  }
}
```

### POST /reviews/:reviewId/helpful

Mark a review as helpful.

**Authentication:** Required (any role)

**Response (200):**
```json
{
  "message": "Review marked as helpful",
  "helpfulCount": 5
}
```

**Note:** Users can only mark each review as helpful once. Calling again will unmark it.

---

## Order Status Flow

```
PLACED → RECEIVED → ACCEPTED → PREPARING → READY → DRIVER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED

Alternative: PLACED → CANCELLED (customer can cancel while PLACED)
```

---

## Eco-Rewards System

### Packaging Preferences
- `reusable`: +10 eco-points
- `compostable`: +5 eco-points
- `minimal`: +0 eco-points
- `standard`: +0 eco-points

### Seasonal Items
- Variable eco-points per item (set by restaurant)
- Bonus points added to order total
- Example: Pumpkin Harvest Bowl = +25 points

### Order Combination
- +20 eco-points for participating customers

### Driver Incentives
- Electric vehicles: +15 points per delivery
- Hybrid vehicles: +10 points per delivery
- Gas vehicles: +5 points per delivery

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (optional)"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (e.g., duplicate review)
- `500`: Internal Server Error
