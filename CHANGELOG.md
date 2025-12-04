# Changelog

All notable changes to EcoBites will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Eco challenges and gamification features
- Personalized impact dashboard with carbon footprint tracking
- AI-powered restaurant and meal recommendations
- Reward redemption system for discounts
- Community leaderboards for eco-friendly practices
- Enhanced carbon tracker with visualizations

---

## [0.3.0] - 2024-11

### Added
- **Cancelled Order Marketplace**: Bidding system for cancelled orders to reduce food waste
  - Bid placement with custom amounts and delivery addresses
  - Bid acceptance/rejection by original customer
  - Automatic order reassignment to winning bidder
  - Bid expiration system (24-hour default)
  - View available cancelled orders and manage bids
- **Restaurant Review System**: Comprehensive review and rating functionality
  - Create, read, update, delete reviews for restaurants
  - Overall rating (1-5 stars) with detailed breakdowns (food, service, delivery, value)
  - Automatic rating aggregation for restaurants
  - One review per customer per restaurant constraint
  - Restaurant owner responses to reviews
  - Helpful vote system for reviews
  - Verified reviews linked to delivered orders
  - Rating distribution visualization (5-star breakdown)
- **Profile Management Features**:
  - Address management with automatic geocoding
  - One-time address geocoding for individual orders
  - User preference system (packaging preferences)
  - Reward points history tracking
  - Mark rewards as used functionality
- **Enhanced User Model**:
  - Restaurant rating fields (averageRating, totalReviews, ratingDistribution)
  - Detailed rating breakdowns (food, service, delivery, value)
  - User preferences (packaging preference)
  - Reward history with issue dates and usage status
  - Restaurant image support
- **Enhanced Order Model**:
  - Bidding-related fields (claimedBy, claimedVia, originalTotal)
  - Reward tracking (ecoRewardCredited, driverRewardCredited)
  - Combined order support (combineGroupId, combineWith)

### New Models
- `Bid`: Bidding system for cancelled orders
  - Order reference, bidder information, bid amount
  - Status tracking (PENDING, ACCEPTED, REJECTED, EXPIRED)
  - Delivery address for new customer
  - Payment method preference
  - Automatic expiration timestamp
- `Review`: Restaurant review system
  - Restaurant and customer references
  - Overall and detailed ratings
  - Review comments with 1000 character limit
  - Restaurant response capability
  - Helpful vote tracking
  - Flagging system for moderation
  - Verification status for delivered orders

### New API Endpoints
- **Bids** (`/api/bids`):
  - `GET /cancelled-orders` - View available cancelled orders
  - `POST /` - Place bid on cancelled order
  - `GET /my-bids` - View user's bids
  - `GET /order/:orderId` - View bids for specific order
  - `POST /:bidId/accept` - Accept a bid
  - `POST /:bidId/reject` - Reject a bid
  - `DELETE /:bidId` - Cancel own bid
- **Reviews** (`/api/reviews`):
  - `GET /restaurant/:restaurantId` - Get restaurant reviews with pagination
  - `GET /my-reviews` - Get current user's reviews
  - `POST /` - Create review
  - `PUT /:reviewId` - Update own review
  - `DELETE /:reviewId` - Delete own review
  - `POST /:reviewId/response` - Restaurant responds to review
  - `POST /:reviewId/helpful` - Mark review as helpful
- **Profile** (`/api/profile`):
  - `POST /address` - Update address with geocoding
  - `POST /geocode` - Geocode address without saving
  - `POST /preferences` - Update user preferences
  - `PATCH /users/:userId/points` - Update reward points
  - `PATCH /users/:userId/rewards/:rewardId/use` - Mark reward as used

### Changed
- Enhanced order status workflow to support bid acceptance and reassignment
- Improved eco-rewards system with better tracking and history
- Updated seed script to include reviews, bids, and enhanced user data
- Expanded user authentication to include preferences and reward history

### Documentation
- Complete API documentation for bidding system (`docs/api.md`)
- Complete API documentation for review system (`docs/api.md`)
- Complete API documentation for profile management (`docs/api.md`)
- Detailed component descriptions in `docs/what.md`
- Step-by-step tutorials for new features in `docs/how.md`
- Comprehensive troubleshooting guide updates (`TROUBLESHOOTING.md`)
- Updated installation guide with geocoding setup (`INSTALL.md`)

### Technical
- MongoDB aggregation for restaurant rating calculations
- Compound indexes for efficient review and bid queries
- Pre-save middleware for review verification
- Static methods for rating aggregation
- Instance methods for helpful vote management
- Geocoding API integration support (optional)

---

## [0.2.0] - 2024-10

### Added
- Order combination feature for delivery optimization
  - Find nearby orders within configurable radius (default 500m)
  - Automatic eco-rewards (+20 points) for participating customers
  - Combined order tracking and grouping
- Eco-rewards system with packaging preferences
  - Reusable packaging: +10 points
  - Compostable packaging: +5 points
  - Minimal/Standard packaging: 0 points
- Driver incentives based on vehicle type
  - Electric vehicles: +15 points per delivery
  - Hybrid vehicles: +10 points per delivery
  - Gas vehicles: +5 points per delivery
- Order status tracking with comprehensive history
  - Status workflow from PLACED to DELIVERED
  - Timestamp and actor tracking for each status change
  - Customer order cancellation (when status is PLACED)
- Real-time order updates and tracking
- Seasonal menu item support
  - Mark items as seasonal with custom labels
  - Award bonus eco-points for seasonal items
  - Display seasonal badges and point bonuses

### Changed
- Enhanced order management with status workflows
- Improved user experience with eco-rewards feedback
- Updated order model with reward tracking fields
- Expanded menu item model with seasonal fields

### Documentation
- Comprehensive API documentation (`docs/api.md`)
- Expanded function reference in `docs/what.md`
- Updated tutorials in `docs/how.md`
- Release history and changelog (`CHANGELOG.md`)

---

## [0.1.0] - 2024-09

### Added
- **Core Features**:
  - User authentication system (register/login/logout)
  - Role-based access control (customer/restaurant/driver)
  - JWT token-based authentication with bcrypt password hashing
- **Restaurant Management**:
  - Restaurant profile creation and management
  - Menu item CRUD operations
  - Category-based menu organization
  - Restaurant browsing and search
- **Order System**:
  - Order placement workflow
  - Order status tracking
  - Role-based order views (customer, restaurant, driver)
  - Order history and details
- **Driver Features**:
  - Available order viewing for drivers
  - Order acceptance and assignment
  - Delivery status updates
- **User Roles**:
  - Customer: Browse, order, track
  - Restaurant: Manage menu, fulfill orders
  - Driver: Accept orders, complete deliveries

### Technical Infrastructure
- **Frontend**:
  - React 18 with Vite 7 build tool
  - Tailwind CSS 4 for styling
  - React Router DOM for navigation
  - Axios for API communication
  - Context API for state management
- **Backend**:
  - Node.js 18+ with Express.js 5
  - MongoDB with Mongoose 8 ODM
  - RESTful API architecture
  - JWT authentication middleware
  - Role-based authorization
- **Testing**:
  - Jest + Supertest for backend integration tests
  - Vitest + React Testing Library for frontend
  - Unit and integration test suites
  - MongoDB Memory Server for test database
- **DevOps**:
  - GitHub Actions CI/CD pipeline
  - ESLint for code linting
  - Prettier for code formatting
  - Babel for JavaScript transpilation
  - Codecov for code coverage tracking

### Documentation
- Basic setup guide (`INSTALL.md`)
- Usage tutorials (`docs/how.md`)
- Component reference (`docs/what.md`)
- Project mission statement (`docs/why.md`)
- README with project overview

---

## Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

---

## Release Notes

### Version 0.3.0 - Enhanced Marketplace & Community Features
This release focuses on reducing food waste and building community through a bidding marketplace for cancelled orders and a comprehensive restaurant review system. Key additions include profile management with geocoding, detailed rating aggregations, and reward history tracking.

**Highlights:**
- 🛒 **Marketplace**: Bid on cancelled orders to prevent food waste
- ⭐ **Reviews**: Rate restaurants with detailed breakdowns and helpful votes
- 📍 **Geocoding**: Automatic address coordinate lookup
- 🏆 **Rewards**: Track eco-points history and usage

### Version 0.2.0 - Eco-Rewards & Order Optimization
This release introduced the core eco-rewards system with packaging preferences, seasonal menu highlights, order combination for delivery efficiency, and driver incentives based on vehicle type.

**Highlights:**
- 🌱 Eco-rewards for sustainable choices
- 🍂 Seasonal menu items with bonus points
- 🤝 Order combining for reduced delivery trips
- 🚗 Vehicle-based driver incentives

### Version 0.1.0 - Initial Release
Foundation release with core authentication, restaurant management, order system, and role-based workflows for customers, restaurants, and drivers.

---

## Contributing

Please follow these guidelines when updating the changelog:

1. Add new entries to the `[Unreleased]` section at the top
2. Use present tense for changes ("Add feature" not "Added feature")
3. Group similar changes together under appropriate headings
4. Reference issue/PR numbers when applicable: `(#123)`
5. Keep descriptions concise but informative
6. Move items from `[Unreleased]` to versioned sections on release

### Example Entry Format

```markdown
### Added
- New eco-rewards calculation for order combinations (#123)
- Restaurant review system with rating aggregation (#124)

### Changed
- Enhanced order status workflow to support bidding (#125)

### Fixed
- Order status update race condition (#456)
- Review aggregation performance optimization (#457)

### Security
- Updated JWT secret requirements to minimum 32 characters (#789)
```

---

## Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

---

## Links

- [GitHub Repository](https://github.com/OryWickizer/Software_Engineering)
- [Issue Tracker](https://github.com/OryWickizer/Software_Engineering/issues)
- [Documentation](docs/)
- [Contributing Guidelines](CONTRIBUTING.md)
