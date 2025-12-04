# Installation Guide

This guide will help you set up the EcoBites monorepo on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher (LTS recommended)
- **npm**: Comes with Node.js, version 8 or higher
- **MongoDB**: Local installation or cloud instance (e.g., MongoDB Atlas)
- **Git**: For cloning the repository

### Optional but Recommended
- **Geocoding API Key**: For address geocoding functionality (e.g., Google Maps API, Mapbox, or OpenCage)
  - Without this, address coordinates will need to be entered manually

### Windows Specific
- Use Command Prompt or PowerShell (not Git Bash for server tests)
- For server testing, you may need to install `cross-env` globally if using npm scripts

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd proj2
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (if any)
   npm install

   # Install client dependencies
   cd Ecobites/client
   npm install
   cd ../..

   # Install server dependencies
   cd Ecobites/server
   npm install
   cd ../..
   ```

3. **Set up environment variables**

   Create `.env` file in `Ecobites/server/`:
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/ecobites
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecobites?retryWrites=true&w=majority

   # Server
   PORT=3000
   NODE_ENV=development

   # Authentication
   JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long

   # Geocoding (Optional - for address coordinate lookup)
   GEOCODING_API_KEY=your-geocoding-api-key-here
   # GEOCODING_SERVICE=google  # or mapbox, opencage, etc.
   ```

   **Generate a secure JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   For production, use a strong JWT secret and proper MongoDB URI.

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or start as service
   # macOS:
   brew services start mongodb-community
   
   # Windows:
   net start MongoDB
   
   # Linux:
   sudo systemctl start mongod
   ```

5. **Seed the database** (Optional but recommended for testing)
   ```bash
   cd Ecobites/server
   npm run seed
   ```
   
   This creates:
   - 5 sample users (customers, restaurants, drivers)
   - 3 restaurants with ratings and reviews
   - 15 menu items (including seasonal items)
   - 8 sample orders
   - 10 restaurant reviews with ratings
   - 5 sample bids on cancelled orders

6. **Run the applications**

   **Backend (Terminal 1):**
   ```bash
   cd Ecobites/server
   npm start
   ```
   Server will start on http://localhost:3000

   **Frontend (Terminal 2):**
   ```bash
   cd Ecobites/client
   npm run dev
   ```
   Client will start on http://localhost:5173

## Detailed Setup

### Backend Setup

The server uses Express.js with MongoDB and includes authentication, order management, reviews, bidding system, and testing.

**Key Dependencies:**
- Express 5
- Mongoose 8
- JWT for authentication
- bcrypt for password hashing
- Jest + Supertest for testing
- Geocoding library (if configured)

**Environment Variables:**
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default 3000)
- `JWT_SECRET`: Secret key for JWT tokens (min 32 characters)
- `NODE_ENV`: Environment (development/production)
- `GEOCODING_API_KEY`: API key for address geocoding (optional)

**Database Collections:**
- `users`: Customers, restaurants, and drivers with profiles and ratings
- `menuitems`: Restaurant menu items with seasonal highlights
- `orders`: Orders with status tracking and eco-rewards
- `reviews`: Restaurant reviews with ratings and responses
- `bids`: Bids on cancelled orders

**Running Tests:**
```bash
cd Ecobites/server
npm test

# With coverage
npm test -- --coverage
```

On Windows cmd.exe, you may need:
```bash
set "NODE_OPTIONS=--experimental-vm-modules" && npx jest --coverage
```

### Frontend Setup

The client is a React application built with Vite and styled with Tailwind CSS.

**Key Dependencies:**
- React 18
- Vite 7
- Tailwind CSS 4
- React Router DOM
- Axios for API calls
- Vitest + React Testing Library

**Key Features:**
- User authentication and role-based routing
- Restaurant browsing with ratings and reviews
- Menu viewing with seasonal highlights
- Order placement and tracking
- Review submission and management
- Bidding on cancelled orders
- Profile and preference management
- Eco-rewards tracking

**Running Tests:**
```bash
cd Ecobites/client
npm test

# With coverage
npm test -- --coverage
```

## Feature-Specific Setup

### Review System
- Automatically aggregates restaurant ratings
- Requires completed orders for verified reviews
- Updates restaurant `averageRating`, `totalReviews`, and `ratingDistribution`

### Bidding System
- Cancelled orders become available for bidding
- Bids expire after 24 hours (default)
- Original customer can accept/reject bids
- Winning bid reassigns order to new customer

### Geocoding
- **With API Key**: Automatic coordinate lookup for addresses
- **Without API Key**: Users must manually enter coordinates or feature is disabled
- Supported services: Google Maps, Mapbox, OpenCage, etc.

### Eco-Rewards
- Packaging preferences: reusable (+10), compostable (+5), minimal/standard (0)
- Seasonal items: Variable points set by restaurant
- Order combination: +20 points for participants
- Driver incentives: Electric (+15), hybrid (+10), gas (+5) per delivery

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally or update `MONGODB_URI` for cloud instance
   - Check firewall settings if using cloud MongoDB
   - See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions

2. **Port Already in Use**
   - Change PORT in `.env` or kill process using the port
   - `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Unix)

3. **npm install fails**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json, then reinstall
   - Ensure Node.js version 18+

4. **Test failures on Windows**
   - Install cross-env: `npm install -g cross-env`
   - Update package.json scripts to use cross-env

5. **Geocoding not working**
   - Verify `GEOCODING_API_KEY` is set correctly in `.env`
   - Check API key permissions and rate limits
   - Test API key with manual curl request
   - See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#geocoding-issues)

6. **Review aggregation failing**
   - Ensure MongoDB has proper permissions
   - Check review has valid rating (1-5)
   - Verify restaurant ID is valid
   - See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#review-system-issues)

7. **Bidding system issues**
   - Verify order status is "CANCELLED"
   - Check bid hasn't expired
   - Ensure user permissions are correct
   - See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#bidding-system-issues)

### Development Tips

- Use `npm run dev` in server for auto-restart on changes (if configured)
- Frontend hot-reloads automatically with Vite
- Check console logs for detailed error messages
- Ensure all environment variables are set before starting
- Seed database with `npm run seed` for test data
- Clear test database between test runs for consistency

## Next Steps

After installation:
1. Visit http://localhost:5173 to access the frontend
2. API endpoints available at http://localhost:3000/api/
3. Register a new user account to test authentication
4. Test different user roles (customer, restaurant, driver)
5. Place orders and test the eco-rewards system
6. Try the review system by completing an order
7. Cancel an order and test the bidding marketplace
8. Update your profile and preferences

## Default Seeded Accounts

After running `npm run seed`, you can log in with:

| Role       | Email               | Password  | Notes                          |
|------------|---------------------|-----------|--------------------------------|
| Customer   | alice@example.com   | password  | Has order history and reviews  |
| Customer   | bob@example.com     | password  | Has placed bids                |
| Restaurant | rest1@example.com   | password  | Has menu items and reviews     |
| Restaurant | rest2@example.com   | password  | Has seasonal menu items        |
| Driver     | driver@example.com  | password  | Electric vehicle (15pts/delivery) |

## Production Deployment Considerations

When deploying to production:

1. **Security:**
   - Use strong JWT_SECRET (64+ characters)
   - Enable HTTPS/TLS
   - Set secure cookie flags
   - Configure CORS properly
   - Never commit `.env` to version control

2. **Database:**
   - Use MongoDB Atlas or managed database service
   - Enable authentication and authorization
   - Set up regular backups
   - Configure replica sets for high availability

3. **Geocoding:**
   - Use production API keys with proper rate limits
   - Implement caching for frequently geocoded addresses
   - Set up error handling and fallbacks

4. **Performance:**
   - Enable database indexes
   - Implement caching (Redis)
   - Use CDN for static assets
   - Monitor API rate limits

5. **Monitoring:**
   - Set up error tracking (Sentry, etc.)
   - Monitor database performance
   - Track API usage and response times
   - Set up alerts for system issues

For more information, see:
- [README.md](README.md) - Project overview
- [API Documentation](docs/api.md) - Complete API reference
- [How-To Guide](docs/how.md) - Feature tutorials
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed troubleshooting
