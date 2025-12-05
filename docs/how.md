# How: EcoBites Mini-Tutorials

This document provides worked examples showing how to use key EcoBites features.

---

## User Registration and Login

### Registering a New Customer
1. Navigate to `/login` page
2. Click "New to EcoBites? Join now" to switch to registration mode
3. Fill in required fields:
   - Full name: "John Doe"
   - Role: "Customer" (dropdown selection)
   - Email: "john@example.com"
   - Password: "password123" (minimum 6 characters)
   - Phone: "+1234567890"
4. Click "Create Account"
5. On success, switch back to login mode and proceed to login

### Registering as a Restaurant
1. Navigate to `/login` page
2. Click "New to EcoBites? Join now"
3. Fill in required fields:
   - Full name: "Chef Mario"
   - Role: "Restaurant" (select from dropdown)
   - Email: "mario@pizzeria.com"
   - Password: "password123"
   - Phone: "+1234567890"
   - Restaurant name: "Mario's Pizzeria"
   - Restaurant image URL: "https://example.com/restaurant.jpg" (optional)
   - Cuisine types: "Italian, Pizza" (comma-separated)
4. Click "Create Account"
5. Profile automatically includes rating fields (averageRating: 0, totalReviews: 0)

### Registering as a Driver
1. Navigate to `/login` page
2. Click "New to EcoBites? Join now"
3. Fill in required fields:
   - Full name: "Dave Driver"
   - Role: "Driver" (select from dropdown)
   - Email: "dave@delivery.com"
   - Password: "password123"
   - Phone: "+1234567890"
   - Vehicle type: "Electric" (dropdown - earns 15 pts/delivery)
   - License plate: "ECO-123"
4. Click "Create Account"

### Logging In
1. On login page, enter:
   - Email: "john@example.com"
   - Password: "password123"
2. Click "Sign In"
3. System returns user data including preferences and reward history
4. Redirect based on role:
   - Customer → `/customer`
   - Restaurant → `/restaurants`
   - Driver → `/driver`

---

## Placing an Order

### As a Customer
1. Login as customer and navigate to `/customer`
2. Browse available restaurants with ratings and review counts displayed
3. Click on a restaurant to view menu
4. Notice seasonal items marked with orange "Seasonal" badges and bonus reward points (e.g., "+25 pts")
5. Add items to cart with quantities (seasonal items contribute extra eco-points)
6. Proceed to checkout (`/customer/checkout`)
7. Enter or select delivery address
8. Select packaging preference:
   - **Reusable**: Earns 10 eco-points
   - **Compostable**: Earns 5 eco-points
   - **Minimal**: Earns 0 eco-points
   - **Standard**: Earns 0 eco-points
9. Select payment method (cash, card, or online)
10. Add special instructions if needed
11. Confirm order placement
12. Order created with status "PLACED", order number auto-generated (e.g., ORD000001)
13. Total eco-points = packaging points + seasonal item bonus points

### Order Status Flow
- **PLACED** → Customer places order
- **RECEIVED** → Restaurant receives order notification
- **ACCEPTED** → Restaurant accepts order
- **PREPARING** → Restaurant starts preparation
- **READY** → Order ready for pickup
- **DRIVER_ASSIGNED** → Driver assigned to order
- **PICKED_UP** → Driver picks up order from restaurant
- **OUT_FOR_DELIVERY** → Driver en route to customer
- **DELIVERED** → Order completed, eco-points credited to customer

---

## Cancelling an Order and the Bidding System

### Cancelling an Order (Customer)
1. Navigate to `/customer/orders`
2. Find order with status "PLACED"
3. Click "Cancel Order" button
4. Confirm cancellation
5. Order status changes to "CANCELLED"
6. Cancelled order becomes available for bidding

### Viewing Cancelled Orders Available for Bidding
1. Login as any customer
2. Navigate to bidding marketplace (e.g., `/bids` or `/marketplace`)
3. View list of cancelled orders showing:
   - Restaurant name
   - Items in order
   - Original total
   - Delivery address
   - Time since cancellation

### Placing a Bid on a Cancelled Order
1. Browse available cancelled orders
2. Click "Place Bid" on desired order
3. Fill in bid form:
   - Bid amount: $18.00 (must be ≥ 0)
   - Message: "I'd love to take this order!" (optional, max 500 chars)
   - Your delivery address:
     - Street: "456 Oak Avenue"
     - City: "Anytown"
     - Zip Code: "12345"
   - Payment method: Card (dropdown: cash/card/online)
4. Click "Submit Bid"
5. Bid created with status "PENDING" and expiration time (default 24 hours)

### Managing Your Bids
1. Navigate to `/my-bids`
2. View all your bids with statuses:
   - **PENDING**: Waiting for original customer decision
   - **ACCEPTED**: Your bid won, order assigned to you
   - **REJECTED**: Bid declined
   - **EXPIRED**: Bid expired (24 hours passed)
3. Cancel pending bids if you change your mind

### Reviewing Bids on Your Cancelled Order (Original Customer)
1. Navigate to your order detail page
2. View "Bids Received" section showing:
   - Bidder information
   - Bid amount
   - Message
   - Delivery address
   - Time submitted
3. Compare bids and select best option

### Accepting a Bid
1. On your cancelled order page, review available bids
2. Click "Accept Bid" on preferred bid
3. System automatically:
   - Updates order with new customer (bidder)
   - Changes order total to bid amount
   - Stores original total in `originalTotal` field
   - Sets order status back to "PLACED"
   - Marks bid as "ACCEPTED"
   - Rejects all other pending bids
4. Bidder becomes new customer for the order
5. Order proceeds through normal workflow from PLACED status

### API Example: Place Bid (POST /api/bids)
```json
{
  "orderId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "bidAmount": 18.00,
  "message": "I'd love to take this order!",
  "deliveryAddress": {
    "street": "456 Oak Avenue",
    "city": "Anytown",
    "zipCode": "12345",
    "coordinates": {
      "lat": 35.7796,
      "lng": -78.6382
    }
  },
  "paymentMethod": "card"
}
```

---

## Restaurant Review System

### Writing a Review (Customer)
1. Complete an order (status must be "DELIVERED")
2. Navigate to `/restaurants/:restaurantId` or your order history
3. Click "Write Review" button
4. Fill in review form:
   - **Overall Rating**: 5 stars (required, 1-5)
   - **Comment**: "Excellent food and service!" (optional, max 1000 chars)
   - **Detailed Ratings** (optional):
     - Food quality: 5 stars
     - Service: 5 stars
     - Delivery: 4 stars
     - Value for money: 5 stars
5. Click "Submit Review"
6. Review auto-verified if linked to delivered order
7. Restaurant's aggregate rating automatically updated

### Viewing Restaurant Reviews
1. Navigate to restaurant page
2. See aggregate ratings:
   - Overall average: 4.5 stars
   - Total reviews: 23
   - Rating distribution (5★: 15, 4★: 5, 3★: 2, 2★: 1, 1★: 0)
   - Detailed ratings (food: 4.6, service: 4.4, delivery: 4.5, value: 4.3)
3. Browse individual reviews with pagination (10 per page)
4. Sort reviews by:
   - Newest first
   - Highest rating
   - Lowest rating
   - Most helpful

### Marking a Review as Helpful
1. While viewing reviews, find helpful review
2. Click "👍 Helpful" button
3. Helpful count increments
4. Click again to unmark as helpful
5. Each user can mark each review helpful once

### Restaurant Owner Responding to Reviews
1. Login as restaurant owner
2. Navigate to reviews page
3. View customer reviews
4. Click "Respond" on a review
5. Enter response text (max 1000 chars): "Thank you for your feedback! We're glad you enjoyed your meal."
6. Click "Submit Response"
7. Response displayed under review with timestamp
8. Response visible to all users

### Editing Your Review
1. Navigate to `/my-reviews`
2. Find review you want to edit
3. Click "Edit" button
4. Modify rating, comment, or detailed ratings
5. Click "Save Changes"
6. Restaurant's aggregate rating recalculated

### Deleting Your Review
1. Navigate to `/my-reviews`
2. Find review to delete
3. Click "Delete" button
4. Confirm deletion
5. Review removed and restaurant ratings updated

### API Example: Create Review (POST /api/reviews)
```json
{
  "restaurantId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "orderId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "rating": 5,
  "comment": "Excellent food and service!",
  "ratings": {
    "food": 5,
    "service": 5,
    "delivery": 4,
    "value": 5
  }
}
```

---

## Profile and Preferences Management

### Updating Your Delivery Address
1. Navigate to `/profile`
2. Click "Update Address"
3. Enter new address:
   - Street: "789 Maple Lane"
   - City: "Anytown"
   - Zip Code: "12345"
4. Click "Save Address"
5. System geocodes address and saves coordinates
6. Address saved to profile for future orders

### Geocoding Address for One-Time Order
1. During checkout, enter delivery address
2. System calls geocoding API without saving to profile
3. Coordinates calculated for delivery distance estimation
4. Address only used for this specific order

### Setting Packaging Preference
1. Navigate to `/profile/preferences`
2. Select default packaging preference:
   - Reusable (+10 points)
   - Compostable (+5 points)
   - Minimal (0 points)
   - Standard (0 points)
3. Click "Save Preferences"
4. Future orders automatically use this preference
5. Can override during individual checkout

### Viewing Reward Points History
1. Navigate to `/profile`
2. View "Eco-Rewards" section showing:
   - Total points: 150
   - Recent rewards:
     - +10 points (Reusable packaging) - Jan 15, 2024
     - +25 points (Seasonal item) - Jan 14, 2024
     - +20 points (Order combination) - Jan 13, 2024
3. Each reward shows amount, date issued, and usage status

### Using Reward Points
1. During checkout, see available reward points
2. Select amount to redeem (if system supports redemption)
3. Points deducted from total
4. Reward marked as "used" in history

### API Example: Update Address (POST /api/profile/address)
```json
{
  "street": "789 Maple Lane",
  "city": "Anytown",
  "zipCode": "12345"
}
```

Response includes geocoded coordinates:
```json
{
  "message": "Address updated successfully",
  "address": {
    "street": "789 Maple Lane",
    "city": "Anytown",
    "zipCode": "12345",
    "coordinates": {
      "lat": 35.7796,
      "lng": -78.6382
    }
  }
}
```

---

## Updating Order Status

### As a Restaurant
1. Login as restaurant and navigate to `/restaurants/orders`
2. View incoming orders with status "PLACED"
3. Review order details (items, customer info, special instructions)
4. Update status to "ACCEPTED" to confirm order
5. Update to "PREPARING" when starting food prep
6. Update to "READY" when order is prepared for pickup
7. Order now visible to drivers in available orders list

### As a Driver
1. Login as driver and navigate to `/driver`
2. View "Available Orders" tab showing READY and COMBINED orders
3. Orders display:
   - Restaurant name and pickup address
   - Customer name and delivery address
   - Items and total amount
   - Distance and estimated time
4. Click "Accept Order" to assign yourself
5. Status automatically updates to "DRIVER_ASSIGNED"
6. Navigate to restaurant and click "Picked Up" when collected
7. Status updates to "PICKED_UP"
8. Click "Out for Delivery" when heading to customer
9. Status updates to "OUT_FOR_DELIVERY"
10. Click "Delivered" when completed
11. Status updates to "DELIVERED"
12. System automatically:
    - Credits eco-rewards to customer based on packaging
    - Credits driver incentive points based on vehicle type
    - Marks rewards as credited to prevent double-crediting

### As a Customer
1. Navigate to `/customer/orders` to view order history
2. View current order status with real-time tracking
3. See status progress indicator
4. **Cancel order** if still in "PLACED" status
5. View driver location (if shared)
6. Upon delivery, earn eco-reward points based on:
   - Packaging choice (0-10 points)
   - Seasonal items bonus (varies per item)
7. After first login, see dismissible banner encouraging seasonal highlights

---

## Managing Menu Items (Restaurant)

### Creating a Regular Menu Item
1. Login as restaurant and navigate to `/restaurants/menu`
2. Click "Add Item" button
3. Fill in the form:
   - Item Name: "Margherita Pizza"
   - Description: "Classic tomato and mozzarella"
   - Price: 12.99
   - Category: "Main" (select from dropdown: appetizer/main/dessert/beverage/side)
   - Image URL: "https://example.com/pizza.jpg" (optional)
   - Preparation Time: 15 minutes
   - Packaging Options: Check reusable, compostable, minimal
4. Leave "Seasonal highlight" unchecked
5. Click "Create Item"
6. Item appears in menu list

### Creating a Seasonal Menu Item
1. Follow steps 1-3 above for regular item
2. **Check the "Seasonal highlight" checkbox**
3. Enter seasonal label: "Halloween" or "Christmas"
4. Enter seasonal reward points: 25 (for main dish) or 15 (for beverage)
5. System displays reward points field when seasonal is checked
6. Click "Create Item"
7. Item appears with orange "Seasonal" badge
8. "+25 pts" indicator shown to customers

### Updating a Menu Item
1. Navigate to `/restaurants/menu`
2. Find item to update
3. Click "Edit" button
4. Modify fields (name, price, seasonal status, etc.)
5. Can toggle seasonal on/off
6. Can update seasonal reward points
7. Click "Save Changes"

### Viewing Seasonal Items
- Seasonal items show with visual badges in restaurant menu list
- Customers see seasonal items with reward point bonuses
- Use GET /api/menu/restaurant/:id/seasonal to fetch only seasonal items
- Use GET /api/menu/seasonal to fetch up to 20 seasonal items across all restaurants

### API Example: Create Seasonal Item (POST /api/menu)
```json
{
  "restaurantId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "name": "Pumpkin Harvest Bowl",
  "description": "Seasonal fall harvest bowl with roasted pumpkin",
  "price": 14.99,
  "category": "main",
  "image": "https://example.com/pumpkin-bowl.jpg",
  "preparationTime": 20,
  "isSeasonal": true,
  "seasonalLabel": "Halloween",
  "seasonalRewardPoints": 25,
  "packagingOptions": ["compostable", "minimal"]
}
```

---

## Combining Orders for Efficient Delivery

### As a Customer
1. Place an order with delivery address
2. Navigate to order detail page
3. Click "Combine with Neighbors" button
4. System searches for nearby orders:
   - Within 500m radius (default)
   - Same city and zip code
   - Status: PLACED or READY
   - Placed within last 30 minutes
5. If nearby orders found:
   - Both customers earn +20 eco-points
   - Orders marked as "COMBINED" status
   - Orders linked together for driver efficiency
   - Combined group ID assigned
6. If no nearby orders:
   - Notification displayed
   - Order remains in normal status
7. Driver can pick up multiple combined orders in one trip

### API Example: Combine Orders (POST /api/orders/combine)
```json
{
  "customerId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "radiusMeters": 500
}
```

Response includes combined orders and eco-point awards:
```json
{
  "message": "Orders combined! Both you and your neighbors earned 20 eco points.",
  "combinedOrders": [
    {
      "_id": "order1-id",
      "orderNumber": "ORD000001",
      "status": "COMBINED"
    },
    {
      "_id": "order2-id",
      "orderNumber": "ORD000002",
      "status": "COMBINED"
    }
  ],
  "updatedOrderIds": ["order1-id", "order2-id"]
}
```

---

## Driver Eco-Rewards and Incentives

### Vehicle Type Impact
When a driver completes a delivery (status updated to "DELIVERED"):
1. **Electric Vehicle**: +15 eco-points per delivery
2. **Hybrid Vehicle**: +10 eco-points per delivery
3. **Gas Vehicle**: +5 eco-points per delivery

### Viewing Driver Performance
1. Navigate to `/driver/insights`
2. View performance metrics:
   - Total deliveries completed
   - Total eco-points earned
   - Average delivery time
   - Customer ratings
   - Efficiency score
3. View rewards breakdown by vehicle type

### Example Delivery Completion
1. Driver with electric vehicle completes delivery
2. Order status → "DELIVERED"
3. System credits:
   - Customer: Packaging points (10) + Seasonal bonus (25) = 35 points
   - Driver: Vehicle incentive = 15 points
4. Both rewards marked as credited
5. Points added to respective user accounts

---

## Common Workflows Summary

### Complete Customer Journey
1. **Register** → Login → Browse restaurants
2. **View ratings** → Read reviews → Select restaurant
3. **Browse menu** → Add items (including seasonal) → Checkout
4. **Select packaging** → Enter address → Place order
5. **Track status** → Receive delivery → Earn eco-points
6. **Write review** → Rate restaurant → Mark others' reviews helpful

### Complete Restaurant Journey
1. **Register** → Login → Set up profile
2. **Create menu items** → Mark seasonal items → Set prices
3. **Receive orders** → Accept → Prepare → Mark ready
4. **View reviews** → Respond to feedback → Improve ratings

### Complete Driver Journey
1. **Register** with vehicle type → Login
2. **View available orders** → Accept order → Navigate to restaurant
3. **Pick up** → Out for delivery → Complete delivery
4. **Earn vehicle-based incentives** → View performance metrics

### Complete Bidding Journey
1. Customer cancels order → Order enters bidding marketplace
2. New customers browse cancelled orders → Place bids
3. Original customer reviews bids → Accepts best bid
4. Order reassigned to winning bidder → Normal workflow continues
5. Other bids automatically rejected

---

## Testing and Development Tips

### Seeding Database
```bash
cd Ecobites/server
npm run seed
```
Creates sample:
- 5 users (customers, restaurants, drivers)
- 3 restaurants with ratings
- 15 menu items (some seasonal)
- 8 sample orders
- 10 reviews with ratings
- 5 bids on cancelled orders

### Testing Review Aggregation
1. Create multiple reviews for one restaurant
2. Verify `averageRating` updates automatically
3. Check `ratingDistribution` counts
4. Verify `detailedRatings` for food/service/delivery/value

### Testing Bidding System
1. Cancel an order (set status to "CANCELLED")
2. Place multiple bids from different customers
3. Accept one bid
4. Verify order reassignment and other bids rejected
5. Check bid expiration after 24 hours

### Testing Geocoding
1. Update address in profile
2. Verify coordinates are calculated and saved
3. Test one-time geocoding during checkout
4. Verify distance calculations for order combining

