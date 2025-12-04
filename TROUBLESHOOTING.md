# Troubleshooting Guide

This guide covers common issues you might encounter while setting up and running EcoBites, along with step-by-step solutions.

---

## Table of Contents

1. [MongoDB Setup Issues](#mongodb-setup-issues)
2. [Environment Variables](#environment-variables)
3. [Database Seeding](#database-seeding)
4. [Port Conflicts](#port-conflicts)
5. [Authentication Issues](#authentication-issues)
6. [Review System Issues](#review-system-issues)
7. [Bidding System Issues](#bidding-system-issues)
8. [Geocoding Issues](#geocoding-issues)
9. [Test Failures](#test-failures)
10. [Package Installation Issues](#package-installation-issues)
11. [Build and Development Server Issues](#build-and-development-server-issues)

---

## MongoDB Setup Issues

### Issue: Cannot connect to MongoDB

**Error Message:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**

#### Option 1: Local MongoDB Setup

1. **Install MongoDB Community Edition**
   - **macOS:** 
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community
     ```
   - **Windows:** Download installer from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - **Linux (Ubuntu):**
     ```bash
     sudo apt-get install -y mongodb-org
     ```

2. **Start MongoDB Service**
   - **macOS:**
     ```bash
     brew services start mongodb-community
     ```
   - **Windows:** MongoDB should start automatically, or use:
     ```cmd
     net start MongoDB
     ```
   - **Linux:**
     ```bash
     sudo systemctl start mongod
     sudo systemctl enable mongod
     ```

3. **Verify MongoDB is Running**
   ```bash
   mongosh
   # You should see MongoDB shell prompt
   ```

#### Option 2: MongoDB Atlas (Cloud Database)

1. **Create Free MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (M0 Sandbox - FREE)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Whitelist Your IP Address**
   - In Atlas, go to "Network Access"
   - Add your current IP address
   - Or add `0.0.0.0/0` (allow from anywhere - for development only)

4. **Create Database User**
   - In Atlas, go to "Database Access"
   - Add new database user with password
   - Grant "Read and write to any database" permission

5. **Update Your `.env` File**
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecobites?retryWrites=true&w=majority
   ```

---

## Environment Variables

### Issue: Missing or Invalid Environment Variables

**Error Message:**
```
Error: JWT_SECRET is not defined
```
or
```
TypeError: Cannot read property 'MONGODB_URI' of undefined
```

**Solution:**

1. **Create `.env` File in Server Directory**
   ```bash
   cd Ecobites/server
   touch .env
   ```

2. **Add Required Variables**
   
   Open `.env` and add:
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/ecobites
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecobites

   # Server
   PORT=3000
   NODE_ENV=development

   # Authentication
   JWT_SECRET=your-super-secure-random-jwt-secret-minimum-32-characters-long

   # Geocoding API (if using external service)
   GEOCODING_API_KEY=your-geocoding-api-key-here
   ```

3. **Generate Secure JWT Secret**
   
   Run this command to generate a random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Verify Environment Variables Load**
   ```bash
   cd Ecobites/server
   node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
   ```

**Important:** Never commit your `.env` file to version control.

---

## Database Seeding

### Issue: Database is Empty / No Test Data

**Solution: Seed the Database**

1. **Ensure MongoDB is Running**
   ```bash
   mongosh
   # Type 'exit' to leave mongo shell
   ```

2. **Navigate to Server Directory**
   ```bash
   cd Ecobites/server
   ```

3. **Run the Seed Script**
   ```bash
   npm run seed
   ```

4. **Expected Output**
   ```
   🌱 Database seeded successfully!
   ✅ Created 5 users
   ✅ Created 3 restaurants
   ✅ Created 15 menu items (including seasonal items)
   ✅ Created 8 sample orders
   ✅ Created 10 reviews
   ✅ Created 5 bids
   ```

5. **Verify Data Was Created**
   ```bash
   mongosh ecobites
   # In mongo shell:
   db.users.countDocuments()
   db.menuitems.countDocuments()
   db.orders.countDocuments()
   db.reviews.countDocuments()
   db.bids.countDocuments()
   ```

6. **Re-seed Database (Clear and Recreate)**
   ```bash
   mongosh ecobites
   use ecobites
   db.dropDatabase()
   exit
   
   npm run seed
   ```

### Default Seeded Users

| Role       | Email               | Password  |
|------------|---------------------|-----------|
| Customer   | alice@example.com   | password  |
| Customer   | bob@example.com     | password  |
| Restaurant | rest1@example.com   | password  |
| Restaurant | rest2@example.com   | password  |
| Driver     | driver@example.com  | password  |

---

## Port Conflicts

### Issue: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

#### Option 1: Kill the Process Using the Port

**macOS/Linux:**
```bash
# Backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

**Windows (Command Prompt):**
```cmd
# Backend
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Frontend
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

#### Option 2: Change the Port

**Backend:**
Edit `Ecobites/server/.env`:
```
PORT=3001
```

**Frontend:**
Edit `Ecobites/client/vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 5174,
  }
})
```

---

## Authentication Issues

### Issue: Login Fails / Token Errors

**Error Message:**
```
401 Unauthorized
```
or
```
jwt malformed
```

**Solutions:**

#### 1. Check JWT_SECRET
Ensure `JWT_SECRET` is set in `.env` and is at least 32 characters long.

#### 2. Clear Browser Cookies
The app uses httpOnly cookies for authentication:
- **Chrome/Edge:** Settings → Privacy → Clear browsing data → Cookies
- **Firefox:** Settings → Privacy → Clear Data → Cookies
- Or use incognito/private mode

#### 3. Check Server is Running
```bash
cd Ecobites/server
npm start
```

#### 4. CORS Issues
Check `Ecobites/client/src/api/axios.config.js` has correct baseURL.

#### 5. Re-seed Database
User passwords may be corrupted:
```bash
cd Ecobites/server
npm run seed
```

---

## Review System Issues

### Issue: Cannot Create Review

**Error Message:**
```
409 Conflict: Review already exists
```

**Cause:** Users can only submit one review per restaurant.

**Solution:**
- Update existing review instead of creating new one
- Delete old review first, then create new one

### Issue: Review Not Verified

**Problem:** Review shows `verified: false` even though linked to order.

**Solution:**
1. Check order status is "DELIVERED" or "delivered"
2. Verify `orderId` in review matches actual order ID
3. Confirm `customerId` matches order customer
4. Re-save review to trigger verification middleware

### Issue: Restaurant Rating Not Updating

**Problem:** After adding/updating/deleting review, restaurant's `averageRating` doesn't change.

**Solution:**
1. Check MongoDB connection is stable
2. Manually trigger rating update:
   ```javascript
   const Review = require('./models/Review.model');
   await Review.updateRestaurantRating('restaurant-id');
   ```
3. Verify review has valid rating (1-5)
4. Check MongoDB aggregation pipeline permissions

### Issue: Cannot Mark Review as Helpful

**Error Message:**
```
500 Internal Server Error
```

**Solution:**
1. Ensure user is authenticated
2. Check review ID is valid
3. Verify user hasn't already marked review (system should toggle, not error)
4. Check `helpfulBy` array isn't corrupted

---

## Bidding System Issues

### Issue: Cannot Place Bid on Cancelled Order

**Error Message:**
```
400 Bad Request: Order is not available for bidding
```

**Possible Causes:**
1. Order status is not "CANCELLED"
2. Order already has accepted bid
3. Order doesn't exist

**Solution:**
1. Verify order status:
   ```bash
   mongosh ecobites
   db.orders.findOne({_id: ObjectId("order-id")})
   ```
2. Ensure order status is exactly "CANCELLED" (case-sensitive)
3. Check no other bid has been accepted for this order

### Issue: Bid Expiration Not Working

**Problem:** Bids not automatically expiring after 24 hours.

**Solution:**
1. Implement scheduled job or cron to check `expiresAt` field
2. Manually expire old bids:
   ```javascript
   await Bid.updateMany(
     { expiresAt: { $lt: new Date() }, status: 'PENDING' },
     { status: 'EXPIRED' }
   );
   ```
3. Add TTL index on `expiresAt` field in MongoDB

### Issue: Cannot Accept Bid

**Error Message:**
```
403 Forbidden: Not authorized to accept this bid
```

**Solution:**
1. Ensure authenticated user is the original order customer
2. Verify order hasn't already been claimed
3. Check bid status is "PENDING"
4. Confirm bid hasn't expired

### Issue: Order Not Reassigned After Accepting Bid

**Problem:** After accepting bid, order still shows original customer.

**Solution:**
1. Check bid acceptance controller logic updates order correctly
2. Verify these fields are updated:
   - `customerId` → bidder's ID
   - `claimedBy` → bidder's ID
   - `claimedVia` → 'BID'
   - `originalTotal` → saved before update
   - `total` → updated to bid amount
   - `status` → reset to 'PLACED'
3. Check other pending bids are rejected

### Issue: Multiple Bids Accepted for Same Order

**Problem:** Database allows multiple accepted bids.

**Solution:**
1. Add transaction/atomic operation to bid acceptance
2. Use MongoDB `findOneAndUpdate` with conditions:
   ```javascript
   const bid = await Bid.findOneAndUpdate(
     { _id: bidId, status: 'PENDING' },
     { status: 'ACCEPTED' },
     { new: true }
   );
   if (!bid) throw new Error('Bid already processed');
   ```
3. Add unique compound index: `{ orderId: 1, status: 1 }` with condition `status === 'ACCEPTED'`

---

## Geocoding Issues

### Issue: Address Geocoding Fails

**Error Message:**
```
500 Internal Server Error: Failed to geocode address
```

**Possible Causes:**
1. Missing or invalid geocoding API key
2. API rate limit exceeded
3. Invalid address format
4. Network connectivity issues

**Solution:**

#### 1. Check Environment Variable
```bash
echo $GEOCODING_API_KEY  # Should show your API key
```

#### 2. Verify API Key is Valid
- Log in to your geocoding service provider
- Check API key hasn't been revoked
- Verify API key has correct permissions

#### 3. Test Geocoding Manually
```bash
curl "https://your-geocoding-api.com/geocode?address=123+Main+St&key=YOUR_KEY"
```

#### 4. Implement Fallback
If geocoding fails, allow manual coordinate entry:
```javascript
if (!coordinates) {
  // Prompt user to enter coordinates manually
  // or use default coordinates for city
}
```

#### 5. Check Rate Limits
- Monitor API usage dashboard
- Implement caching for frequently geocoded addresses
- Consider upgrading API plan

### Issue: Coordinates Not Saving

**Problem:** Geocoding succeeds but coordinates not saved to database.

**Solution:**
1. Check address schema includes `coordinates` field:
   ```javascript
   coordinates: {
     lat: Number,
     lng: Number
   }
   ```
2. Verify controller saves entire address object
3. Check for validation errors in Mongoose

---

## Test Failures

### Issue: Tests Failing Locally

**Common Causes & Solutions:**

#### 1. MongoDB Not Running
Ensure MongoDB is running before tests:
```bash
brew services start mongodb-community  # macOS
net start MongoDB                      # Windows
sudo systemctl start mongod            # Linux
```

#### 2. Test Database Conflicts
Clear test database:
```bash
mongosh ecobites_test
db.dropDatabase()
exit
```

#### 3. Port Conflicts During Tests
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 4. Missing Dependencies
```bash
# Backend
cd Ecobites/server
npm install

# Frontend
cd Ecobites/client
npm install
```

#### 5. Run Tests with Coverage

**Backend (Jest):**
```bash
cd Ecobites/server
npm test -- --coverage
```

**Frontend (Vitest):**
```bash
cd Ecobites/client
npm test -- --coverage
```

#### 6. Run Specific Test File

**Backend:**
```bash
npm test -- tests/integration/reviews.test.mjs
npm test -- tests/integration/bids.test.mjs
```

**Frontend:**
```bash
npm test -- src/tests/ReviewForm.test.jsx
```

### Issue: Review Tests Failing

**Common Issues:**
1. Restaurant rating aggregation not updating
2. Duplicate review validation not working
3. Helpful marking failing

**Solution:**
```bash
# Clear test data
mongosh ecobites_test
db.reviews.deleteMany({})
db.users.deleteMany({})
exit

# Run tests again
npm test -- tests/integration/reviews.test.mjs
```

### Issue: Bid Tests Failing

**Common Issues:**
1. Bid expiration logic not working
2. Order reassignment failing
3. Multiple bids accepted

**Solution:**
```bash
# Clear test data
mongosh ecobites_test
db.bids.deleteMany({})
db.orders.deleteMany({})
exit

# Run with verbose logging
npm test -- tests/integration/bids.test.mjs --verbose
```

---

## Package Installation Issues

### Issue: npm install Fails

**Error Message:**
```
npm ERR! code EACCES
```

**Solutions:**

#### 1. Permission Issues (macOS/Linux)
Don't use `sudo` with npm:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

#### 2. Clear npm Cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. Use npm ci for Clean Install
```bash
npm ci
```

#### 4. Node Version Mismatch
Ensure Node.js 18 or higher:
```bash
node --version  # Should show v18.x.x or higher

# Use nvm to switch versions
nvm install 18
nvm use 18
```

---

## Build and Development Server Issues

### Issue: Frontend Build Fails

**Solution:**

1. **Clear Build Cache**
   ```bash
   cd Ecobites/client
   rm -rf dist node_modules .vite
   npm install
   npm run build
   ```

2. **Check for Syntax Errors**
   ```bash
   npm run lint
   ```

3. **Memory Issues**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

### Issue: Hot Module Reload Not Working

**Solution:**

1. **Restart Dev Server**
   ```bash
   # Kill server (Ctrl+C)
   npm run dev
   ```

2. **Clear Vite Cache**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

## Quick Checklist

Before asking for help, verify:

- [ ] MongoDB is running (`mongosh` connects successfully)
- [ ] `.env` file exists with all required variables (including `GEOCODING_API_KEY` if needed)
- [ ] Database is seeded with reviews and bids (`npm run seed`)
- [ ] All dependencies installed in both client and server
- [ ] Correct Node.js version (18+)
- [ ] No port conflicts (3000 and 5173 are free)
- [ ] Browser cookies cleared (for auth issues)
- [ ] Both client and server running in separate terminals

---

## New Feature Specific Issues

### Review System Checklist
- [ ] Review model properly indexed (restaurantId + customerId unique)
- [ ] Rating aggregation triggers on create/update/delete
- [ ] One review per customer per restaurant enforced
- [ ] Helpful votes properly tracked

### Bidding System Checklist
- [ ] Only cancelled orders show in marketplace
- [ ] Bids expire after 24 hours
- [ ] Only original customer can accept bids
- [ ] Order properly reassigned on bid acceptance
- [ ] Other bids rejected when one accepted

### Geocoding Checklist
- [ ] API key configured in environment
- [ ] Address format validated before geocoding
- [ ] Coordinates saved to database
- [ ] Fallback strategy for geocoding failures

---

## Useful Commands Reference

```bash
# Start MongoDB
brew services start mongodb-community  # macOS
net start MongoDB                      # Windows
sudo systemctl start mongod            # Linux

# Seed database (now includes reviews and bids)
cd Ecobites/server && npm run seed

# Run tests
cd Ecobites/server && npm test
cd Ecobites/client && npm test

# Run specific test suites
npm test -- tests/integration/reviews.test.mjs
npm test -- tests/integration/bids.test.mjs

# Start servers
cd Ecobites/server && npm start
cd Ecobites/client && npm run dev

# Check MongoDB data
mongosh ecobites
db.reviews.find().pretty()
db.bids.find().pretty()

# Clear specific collections
db.reviews.deleteMany({})
db.bids.deleteMany({})
```

---

## Still Having Issues?

If none of the solutions work:

1. **Check the logs** in both terminal windows
2. **Open browser console** (F12) for JavaScript errors
3. **Check MongoDB logs** for database issues
4. **Create an issue** on GitHub with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment details (OS, Node version, MongoDB version)
   - Output of `npm list` in both directories
