# Presentation Guide - Hotel Booking System
## Assignment 7 Enhancement with Google OAuth

---

## 📋 Presentation Structure

### Slide 1: Title Slide
**Content:**
- Title: "Hotel Booking System with Google OAuth Integration"
- Subtitle: "Software Development Practice - Assignment 7 Enhancement"
- Your Name & Student ID
- Date: October 26, 2025

---

### Slide 2: โจทย์ที่ได้รับ (Requirements Received)

**Original Requirements (1-3):**
1. ✅ **User Registration**
   - The system shall allow a user to register by specifying:
     - Name
     - Telephone number (10 digits)
     - Email
     - Password

2. ✅ **User Authentication**
   - After registration, user becomes a registered user
   - System shall allow user to log in using email and password
   - System shall allow registered user to log out

3. ✅ **Booking Creation**
   - After login, system shall allow registered user to:
     - Book up to 3 nights
     - Specify booking date
     - Select preferred hotel from provided list

**Excluded Requirements (4-9):**
- ❌ View bookings
- ❌ Edit bookings
- ❌ Delete bookings
- ❌ Admin booking management

**Enhancement Added:**
- ✨ **Google OAuth 2.0** authentication as alternative to basic registration/login

---

### Slide 3: System Architecture Overview

**Technology Stack:**
```
┌─────────────────────────────────────┐
│         Frontend (Client)           │
│  - HTML/JavaScript/Postman          │
│  - JWT Token Storage                │
└──────────────┬──────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────┐
│      Backend API (Express.js)       │
│  - RESTful Routes                   │
│  - JWT Authentication               │
│  - Passport.js (OAuth)              │
│  - Security Middleware              │
└──────────────┬──────────────────────┘
               │ Mongoose ODM
               ▼
┌─────────────────────────────────────┐
│        Database (MongoDB)           │
│  - Users Collection                 │
│  - Hotels Collection                │
│  - Bookings Collection              │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     External Service (Google)       │
│  - OAuth 2.0 Authentication         │
│  - User Profile API                 │
└─────────────────────────────────────┘
```

---

### Slide 4: Code Changes - User Model

**Before (Assignment 7):**
```javascript
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        match: [/^[0-9]{10}$/, 'Please add a valid 10-digit telephone number']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
```

**After (Current - Enhanced for OAuth):**
```javascript
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    tel: {
        type: String,
        required: function() {
            return !this.googleId;  // ⭐ CHANGE: Only required if not OAuth user
        },
        validate: {
            validator: function(v) {
                if (v) {
                    return /^[0-9]{10}$/.test(v);
                }
                return !this.googleId || v === null || v === undefined;
            },
            message: 'Please add a valid 10-digit telephone number'
        }
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    googleId: {  // ⭐ NEW FIELD
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ⭐ CHANGE: Updated password hashing
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {  // Only hash if password modified
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
```

**Key Changes:**
- ✅ `tel` field: Conditionally required (only for non-OAuth users)
- ✅ `googleId` field: Added for OAuth authentication
- ✅ Password hashing: Improved to check if password modified

---

### Slide 5: Code Changes - Models Transformation

**Hospital → Hotel:**
```javascript
// BEFORE: Hospital.js
const HospitalSchema = new mongoose.Schema({
    name: String,
    address: String,
    district: String,
    province: String,
    postalcode: String,
    tel: String,
    region: String
});

// AFTER: Hotel.js (Simplified)
const HotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address'],
    },
    tel: { 
        type: String,
        required: [true, 'Please add a telephone number'],
    }
});
```

**Appointment → Booking:**
```javascript
// BEFORE: Appointment.js
const AppointmentSchema = new mongoose.Schema({
    apptDate: {
        type: Date,
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    hospital: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hospital',
        required: true
    }
});

// AFTER: Booking.js (Enhanced with business rules)
const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: true,
    },
    numOfNights: {
        type: Number,
        required: [true, 'Please add number of nights'],
        min: [1, 'Minimum booking is 1 night'],
        max: [3, 'Maximum booking is 3 nights']  // ⭐ Business rule
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    hotel: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
```

---

### Slide 6: Code Changes - New Passport Configuration

**New File: `/backend/config/passport.js`**
```javascript
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists by email
                    let user = await User.findOne({ 
                        email: profile.emails[0].value 
                    });

                    if (user) {
                        // User exists, return user
                        return done(null, user);
                    } else {
                        // User doesn't exist, create new user
                        const newUser = {
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            password: Math.random().toString(36).slice(-8) + 
                                     Math.random().toString(36).slice(-8),
                            googleId: profile.id,
                            // ⭐ Note: tel is optional for Google users
                            role: 'user'
                        };
                        
                        user = await User.create(newUser);
                        return done(null, user);
                    }
                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );
};
```

**Configuration in server.js:**
```javascript
const passport = require('passport');

// Load Passport config
require('./config/passport')(passport);

// Initialize Passport
app.use(passport.initialize());
```

---

### Slide 7: Code Changes - Authentication Routes

**Enhanced `/backend/routes/auth.js`:**
```javascript
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
    register,
    login,
    getMe,
    logout,
    googleAuthCallback  // ⭐ NEW
} = require('../controllers/auth');

const { protect, authorize } = require('../middleware/auth');

// Basic authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

// ⭐ NEW: Google OAuth routes
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/api/v1/auth/google/failure',
        session: false 
    }),
    googleAuthCallback
);

router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        msg: 'Failed to authenticate with Google'
    });
});

module.exports = router;
```

---

### Slide 8: Code Changes - Booking Controller Simplification

**Before (Assignment 7) - Full CRUD:**
```javascript
// Multiple operations
exports.getBookings = async (req, res) => { /* ... */ };
exports.getBooking = async (req, res) => { /* ... */ };
exports.addBooking = async (req, res) => { /* ... */ };
exports.updateBooking = async (req, res) => { /* ... */ };
exports.deleteBooking = async (req, res) => { /* ... */ };
```

**After (Current) - Create Only:**
```javascript
// Only addBooking remains (Requirements 1-3 only)
exports.addBooking = async (req, res, next) => {
    try {
        req.body.hotel = req.params.hotelId;

        // ⭐ Validate hotel exists
        const hotel = await Hotel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: `No hotel with the id of ${req.params.hotelId}`
            });
        }

        req.body.user = req.user.id;

        // ⭐ Business rule: Check existing bookings
        const existingBookings = await Booking.find({ user: req.user.id });
        if (existingBookings.length >= 3) {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 bookings`
            });
        }

        // Create booking
        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot create booking'
        });
    }
};

// ⭐ REMOVED: getBookings, getBooking, updateBooking, deleteBooking
```

---

### Slide 9: Use Case Diagram

**Insert diagram from:** `diagrams/USE_CASE_DIAGRAM.md`

**Key Points to Highlight:**
- 👤 Three actors: Guest, User, Admin
- 🔐 Two authentication methods: Basic & Google OAuth
- 📝 Core use cases (Requirements 1-3):
  - UC1 & UC2: Registration (Basic/OAuth)
  - UC3 & UC4: Login (Basic/OAuth)
  - UC5: View Hotels
  - UC6: Create Booking (protected)
  - UC7: View Profile (protected)
  - UC8: Logout
  - UC9: Manage Hotels (Admin only)
  - UC10: JWT Authentication (included by protected routes)

**Business Rules:**
- Maximum 3 bookings per user
- Maximum 3 nights per booking
- Phone number optional for OAuth users

---

### Slide 10: Class Diagram

**Insert diagram from:** `diagrams/CLASS_DIAGRAM.md`

**Key Components:**

1. **Models (Data Layer):**
   - User: Authentication & profile
   - Booking: Reservation data
   - Hotel: Accommodation data

2. **Controllers (Business Logic):**
   - AuthController: Registration, login, OAuth
   - BookingController: Create bookings
   - HotelController: Hotel management (admin)

3. **Middleware:**
   - AuthMiddleware: JWT verification & authorization
   
4. **Strategy:**
   - GoogleOAuthStrategy: OAuth authentication

**Relationships:**
- User 1 → * Booking
- Hotel 1 → * Booking
- Controllers → Models (dependency)
- Middleware → Controllers (protection)

---

### Slide 11: Sequence Diagram - Basic Registration

**Insert diagram from:** `diagrams/SEQUENCE_DIAGRAMS.md` (Section 1.1)

**Flow Explanation:**
1. User fills registration form
2. Client sends POST request to `/api/v1/auth/register`
3. AuthController validates input
4. User model:
   - Validates schema (name, tel, email, password)
   - Hashes password with bcrypt
   - Saves to database
5. JWT token is generated
6. Response returns user data + token
7. Client stores token for future requests

**Security Features:**
- Password hashing (bcrypt)
- JWT token generation
- Email uniqueness validation
- Phone number format validation (10 digits)

---

### Slide 12: Sequence Diagram - Google OAuth

**Insert diagram from:** `diagrams/SEQUENCE_DIAGRAMS.md` (Section 2)

**Flow Explanation:**
1. User clicks "Sign in with Google"
2. Browser redirects to Google consent screen
3. User authorizes application
4. Google redirects with authorization code
5. Passport exchanges code for access token
6. Passport retrieves user profile
7. Strategy checks if user exists:
   - **If exists:** Return existing user
   - **If not:** Create new user with Google data
8. JWT token generated and returned

**Key Advantages:**
- No password required
- Email automatically verified
- Faster registration process
- Phone number optional

---

### Slide 13: Sequence Diagram - Create Booking (Protected)

**Insert diagram from:** `diagrams/SEQUENCE_DIAGRAMS.md` (Section 3)

**Flow Explanation:**
1. User selects hotel and dates
2. Client sends POST with JWT token in header
3. **AuthMiddleware:**
   - Extracts & verifies JWT token
   - Loads user from database
   - Attaches user to request
4. **BookingController:**
   - Validates hotel exists
   - Counts user's existing bookings
   - Validates business rules:
     - ✅ Max 3 bookings per user
     - ✅ Max 3 nights per booking
   - Creates booking in database
5. Returns booking confirmation

**Security:**
- JWT token required (authentication)
- User extracted from token (no spoofing)
- Business rules enforced server-side

---

### Slide 14: API Endpoints Summary

**Authentication Endpoints:**
```http
POST   /api/v1/auth/register          # Register with email/password
POST   /api/v1/auth/login             # Login with email/password
GET    /api/v1/auth/google            # Initiate Google OAuth
GET    /api/v1/auth/google/callback   # Google OAuth callback
GET    /api/v1/auth/me                # Get current user (protected)
GET    /api/v1/auth/logout            # Logout
```

**Hotel Endpoints:**
```http
GET    /api/v1/hotels                 # Get all hotels (public)
GET    /api/v1/hotels/:id             # Get single hotel (public)
POST   /api/v1/hotels                 # Create hotel (admin only)
PUT    /api/v1/hotels/:id             # Update hotel (admin only)
DELETE /api/v1/hotels/:id             # Delete hotel (admin only)
```

**Booking Endpoints:**
```http
POST   /api/v1/hotels/:hotelId/bookings  # Create booking (protected)
# ⭐ Note: View/Edit/Delete NOT implemented (Requirements 4-9 excluded)
```

---

### Slide 15: Request/Response Examples

**Example 1: Basic Registration**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "tel": "0812345678",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example 2: Create Booking**
```http
POST /api/v1/hotels/507f191e810c19729de860ea/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "bookingDate": "2025-11-15",
  "numOfNights": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "bookingDate": "2025-11-15T00:00:00.000Z",
    "numOfNights": 2,
    "user": "507f1f77bcf86cd799439011",
    "hotel": "507f191e810c19729de860ea",
    "createdAt": "2025-10-26T00:00:00.000Z"
  }
}
```

---

### Slide 16: Security Features

**Implemented Security Measures:**

1. **Authentication:**
   - JWT tokens (30-day expiration)
   - bcrypt password hashing (10 salt rounds)
   - Google OAuth 2.0

2. **Authorization:**
   - Role-based access control (RBAC)
   - Admin-only routes for hotel management
   - User-specific booking validation

3. **Input Validation:**
   - Email format validation
   - Phone number format (10 digits)
   - Password minimum length (6 characters)
   - Booking nights range (1-3)

4. **Security Middleware:**
   - `helmet` - Security headers
   - `express-rate-limit` - Rate limiting (100 req/10min)
   - `express-mongo-sanitize` - NoSQL injection prevention
   - `express-xss-sanitizer` - XSS attack prevention
   - `cors` - Cross-Origin Resource Sharing

5. **Database Security:**
   - Unique constraints on emails
   - Sparse index on googleId
   - Password never returned in queries

---

### Slide 17: Business Rules Implementation

**Rule 1: Maximum 3 Bookings Per User**
```javascript
const existingBookings = await Booking.find({ user: req.user.id });
if (existingBookings.length >= 3) {
    return res.status(400).json({
        success: false,
        message: `User has already made 3 bookings`
    });
}
```

**Rule 2: Maximum 3 Nights Per Booking**
```javascript
// Enforced in schema
numOfNights: {
    type: Number,
    required: [true, 'Please add number of nights'],
    min: [1, 'Minimum booking is 1 night'],
    max: [3, 'Maximum booking is 3 nights']
}
```

**Rule 3: Phone Number Optional for OAuth**
```javascript
tel: {
    type: String,
    required: function() {
        return !this.googleId;  // Only required if NOT Google user
    },
    validate: {
        validator: function(v) {
            if (v) return /^[0-9]{10}$/.test(v);
            return !this.googleId || v === null || v === undefined;
        }
    }
}
```

**Rule 4: Admin-Only Hotel Management**
```javascript
router.post('/hotels', protect, authorize('admin'), createHotel);
router.put('/hotels/:id', protect, authorize('admin'), updateHotel);
router.delete('/hotels/:id', protect, authorize('admin'), deleteHotel);
```

---

### Slide 18: Testing Documentation

**Testing Resources Provided:**

1. **Postman Collection:**
   - `Hotel_Booking_Auth_Tests.postman_collection.json`
   - 15+ test requests
   - Covers both Basic Auth and OAuth
   - Auto-saves tokens via test scripts

2. **HTML Test Interface:**
   - `test-auth.html`
   - Interactive browser-based testing
   - Beautiful UI with forms
   - Google OAuth button integration

3. **Documentation:**
   - `API_TESTING_GUIDE.md` - Comprehensive guide
   - `QUICK_TEST_REFERENCE.md` - Quick reference
   - `GOOGLE_OAUTH_GUIDE.md` - OAuth setup guide
   - `GOOGLE_OAUTH_QUICKSTART.md` - Quick start

**Test Coverage:**
- ✅ User registration (Basic & OAuth)
- ✅ User login (Basic & OAuth)
- ✅ Protected routes (JWT verification)
- ✅ Booking creation with business rules
- ✅ Hotel listing
- ✅ Error scenarios
- ✅ Validation rules

---

### Slide 19: Project Structure

```
Roomly-Hotel-booking/
├── backend/
│   ├── config/
│   │   ├── config.env          # ⭐ NEW: Google OAuth credentials
│   │   ├── db.js
│   │   └── passport.js         # ⭐ NEW: OAuth strategy
│   ├── controllers/
│   │   ├── auth.js             # ⭐ ENHANCED: Added googleAuthCallback
│   │   ├── bookings.js         # ⭐ SIMPLIFIED: Create only
│   │   └── hotels.js           # ⭐ RENAMED: From hospitals.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification & authorization
│   ├── models/
│   │   ├── User.js             # ⭐ ENHANCED: googleId, conditional tel
│   │   ├── Booking.js          # ⭐ RENAMED: From Appointment.js
│   │   └── Hotel.js            # ⭐ RENAMED: From Hospital.js
│   ├── routes/
│   │   ├── auth.js             # ⭐ ENHANCED: Google OAuth routes
│   │   ├── bookings.js         # ⭐ SIMPLIFIED: POST only
│   │   └── hotels.js           # ⭐ RENAMED: From hospitals.js
│   └── server.js               # ⭐ ENHANCED: Passport initialization
├── diagrams/                    # ⭐ NEW: Documentation
│   ├── USE_CASE_DIAGRAM.md
│   ├── CLASS_DIAGRAM.md
│   └── SEQUENCE_DIAGRAMS.md
├── test-auth.html              # ⭐ NEW: Test interface
├── Hotel_Booking_Auth_Tests.postman_collection.json  # ⭐ NEW
├── API_TESTING_GUIDE.md        # ⭐ NEW
├── GOOGLE_OAUTH_GUIDE.md       # ⭐ NEW
├── PROJECT_DOCUMENTATION.md    # ⭐ NEW: Complete docs
└── package.json
```

---

### Slide 20: Dependencies Added

**New Dependencies:**
```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "express-session": "^1.18.0"
}
```

**All Dependencies:**
```json
{
  "bcryptjs": "^3.0.2",           // Password hashing
  "cookie-parser": "^1.4.7",      // Cookie handling
  "cors": "^2.8.5",               // CORS support
  "dotenv": "^17.2.1",            // Environment variables
  "express": "^5.1.0",            // Web framework
  "express-mongo-sanitize": "^2.2.0",  // NoSQL injection prevention
  "express-rate-limit": "^8.1.0", // Rate limiting
  "express-xss-sanitizer": "^2.0.1",   // XSS prevention
  "helmet": "^8.1.0",             // Security headers
  "jsonwebtoken": "^9.0.2",       // JWT tokens
  "mongoose": "^8.18.0",          // MongoDB ODM
  "passport": "^0.7.0",           // ⭐ NEW: Authentication
  "passport-google-oauth20": "^2.0.0",  // ⭐ NEW: OAuth
  "express-session": "^1.18.0",   // ⭐ NEW: Session support
  "swagger-jsdoc": "^6.2.8",      // API documentation
  "swagger-ui-express": "^5.0.1"  // Swagger UI
}
```

---

### Slide 21: Key Improvements Over Assignment 7

| Aspect | Assignment 7 | Current Implementation | Benefit |
|--------|-------------|------------------------|---------|
| **Authentication** | Basic only | Basic + OAuth | Better UX, faster registration |
| **Phone Number** | Always required | Optional for OAuth | Flexible user data |
| **Security** | Basic | Enhanced (rate limit, XSS, etc.) | Production-ready |
| **Models** | Hospital, Appointment | Hotel, Booking | Domain-aligned |
| **Business Rules** | Manual checks | Schema + Controller validation | Data integrity |
| **Documentation** | Minimal | Comprehensive | Easy maintenance |
| **Testing** | Manual | Automated (Postman, HTML) | Faster testing |
| **Token Type** | Session-based | JWT (stateless) | Scalable |
| **Authorization** | Basic | Role-based (RBAC) | Fine-grained control |
| **Code Quality** | Good | Enhanced | Better maintainability |

---

### Slide 22: Database Schema

**Users Collection:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",
  tel: "0812345678",              // Optional for OAuth users
  email: "john@example.com",      // Unique
  password: "$2a$10$...",          // Hashed
  googleId: "1234567890",         // Only for OAuth users
  role: "user",                   // or "admin"
  createdAt: ISODate("2025-10-26T00:00:00Z")
}
```

**Hotels Collection:**
```javascript
{
  _id: ObjectId("507f191e810c19729de860ea"),
  name: "Grand Hotel",            // Unique
  address: "123 Main St, Bangkok",
  tel: "0212345678",
  createdAt: ISODate("2025-10-26T00:00:00Z")
}
```

**Bookings Collection:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  bookingDate: ISODate("2025-11-15T00:00:00Z"),
  numOfNights: 2,                 // 1-3 range
  user: ObjectId("507f1f77bcf86cd799439011"),
  hotel: ObjectId("507f191e810c19729de860ea"),
  createdAt: ISODate("2025-10-26T00:00:00Z")
}
```

**Indexes:**
- Users: `email` (unique), `googleId` (unique, sparse)
- Hotels: `name` (unique)
- Bookings: `user`, `hotel`

---

### Slide 23: Error Handling

**Standardized Error Responses:**

```json
{
  "success": false,
  "msg": "Error message"
}
```

**Error Types:**

| Status Code | Error Type | Example |
|------------|------------|---------|
| **400** | Bad Request | Validation error, max bookings exceeded |
| **401** | Unauthorized | Missing/invalid token |
| **403** | Forbidden | Insufficient permissions (not admin) |
| **404** | Not Found | Hotel/User not found |
| **500** | Server Error | Database error, internal error |

**Example Error Responses:**
```json
// 400 - Max bookings
{
  "success": false,
  "message": "The user with ID xxx has already made 3 bookings"
}

// 401 - Unauthorized
{
  "success": false,
  "msg": "Not authorized to access this route"
}

// 404 - Not found
{
  "success": false,
  "message": "No hotel with the id of xxx"
}
```

---

### Slide 24: Demonstration Flow

**Suggested Demo Sequence:**

1. **Show Postman Collection:**
   - Import `Hotel_Booking_Auth_Tests.postman_collection.json`
   - Navigate through folders

2. **Demo Basic Registration:**
   - Send POST to `/api/v1/auth/register`
   - Show response with token
   - Highlight password hashing in database

3. **Demo Google OAuth:**
   - Open `test-auth.html` in browser
   - Click "Sign in with Google"
   - Show automatic user creation
   - Show token in response

4. **Demo Protected Route:**
   - Send GET to `/api/v1/auth/me` without token → 401 error
   - Send GET with token → Success

5. **Demo Create Booking:**
   - Show hotel list
   - Create booking (1st)
   - Create booking (2nd)
   - Create booking (3rd)
   - Try 4th booking → Error (max 3)

6. **Demo Business Rules:**
   - Try booking with 4 nights → Error (max 3)
   - Try booking with 0 nights → Error (min 1)

---

### Slide 25: Challenges & Solutions

**Challenge 1: OAuth User Without Phone Number**
- **Problem:** Original schema required phone number for all users
- **Solution:** Made `tel` conditionally required based on `googleId`
- **Code:**
  ```javascript
  tel: {
      required: function() { return !this.googleId; }
  }
  ```

**Challenge 2: Password Hashing for OAuth Users**
- **Problem:** OAuth users don't use passwords, but field is required
- **Solution:** Generate random password, update hashing logic to check if modified
- **Code:**
  ```javascript
  UserSchema.pre('save', async function(next) {
      if (!this.isModified('password')) {
          next();
      }
      // ... hash password
  });
  ```

**Challenge 3: Token Management**
- **Problem:** Different auth methods need consistent token handling
- **Solution:** Centralized `sendTokenResponse` function
- **Benefit:** Consistent token generation for both auth methods

**Challenge 4: Business Rule Enforcement**
- **Problem:** Max 3 bookings and max 3 nights rules
- **Solution:** 
  - Schema validation for nights (1-3)
  - Controller logic for booking count
- **Benefit:** Data integrity at multiple levels

---

### Slide 26: Future Enhancements (Not Implemented)

**Could Be Added Later:**

1. **Profile Update Endpoint**
   - Allow OAuth users to add phone number
   - Update other profile fields
   - `PUT /api/v1/auth/profile`

2. **Booking Management (Requirements 4-9)**
   - View user bookings
   - Edit booking dates
   - Cancel bookings
   - Admin booking oversight

3. **Email Verification**
   - Send verification email on registration
   - Verify email before allowing bookings

4. **Password Reset**
   - Forgot password functionality
   - Reset token via email

5. **Payment Integration**
   - Payment gateway (Stripe, PayPal)
   - Booking confirmation after payment

6. **Hotel Features**
   - Photos upload
   - Amenities list
   - Room types
   - Pricing

7. **Search & Filter**
   - Search hotels by name/location
   - Filter by amenities
   - Date availability check

8. **Reviews & Ratings**
   - User reviews for hotels
   - Rating system (1-5 stars)

---

### Slide 27: Deployment Considerations

**Production Checklist:**

1. **Environment Variables:**
   ```
   NODE_ENV=production
   MONGO_URI=<production-db-uri>
   JWT_SECRET=<strong-secret>
   GOOGLE_CLIENT_ID=<production-client-id>
   GOOGLE_CLIENT_SECRET=<production-secret>
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback
   ```

2. **Security:**
   - Use HTTPS in production
   - Update CORS origins
   - Increase JWT secret strength
   - Enable MongoDB Atlas IP whitelist
   - Set appropriate rate limits

3. **Google OAuth:**
   - Register production domain in Google Cloud Console
   - Update authorized redirect URIs
   - Use production credentials

4. **Database:**
   - MongoDB Atlas production cluster
   - Enable backups
   - Set up monitoring

5. **Server:**
   - Use process manager (PM2)
   - Set up logging (Winston)
   - Enable error tracking (Sentry)
   - Configure load balancing (if needed)

---

### Slide 28: Conclusion

**Summary:**

✅ **Requirements Met:**
- Requirement 1: User registration with name, tel, email, password
- Requirement 2: User login/logout with email and password
- Requirement 3: Booking creation (up to 3 nights, hotel selection)

✨ **Enhancements Added:**
- Google OAuth 2.0 authentication
- JWT token-based authentication
- Role-based authorization
- Enhanced security measures
- Comprehensive documentation
- Automated testing tools

🔒 **Security Features:**
- Password hashing (bcrypt)
- JWT tokens (30-day expiration)
- Rate limiting
- XSS protection
- NoSQL injection prevention
- Security headers (Helmet)

📚 **Documentation Provided:**
- Use Case Diagram
- Class Diagram (UML Profile)
- Sequence Diagrams
- API documentation
- Testing guides
- Complete code documentation

**Result:** Production-ready hotel booking system with modern authentication and enhanced security.

---

### Slide 29: References & Resources

**Documentation Files:**
- `PROJECT_DOCUMENTATION.md` - Complete project documentation
- `API_TESTING_GUIDE.md` - API testing instructions
- `GOOGLE_OAUTH_GUIDE.md` - OAuth implementation guide
- `diagrams/USE_CASE_DIAGRAM.md` - Use case documentation
- `diagrams/CLASS_DIAGRAM.md` - Class structure
- `diagrams/SEQUENCE_DIAGRAMS.md` - Interaction flows

**Testing Resources:**
- `test-auth.html` - Interactive test interface
- `Hotel_Booking_Auth_Tests.postman_collection.json` - Postman tests

**Technologies:**
- Express.js: https://expressjs.com/
- Mongoose: https://mongoosejs.com/
- Passport.js: http://www.passportjs.org/
- JWT: https://jwt.io/
- Google OAuth: https://developers.google.com/identity/protocols/oauth2

**Code Repository:**
- GitHub: RookieJoel/Roomly-Hotel-booking
- Branch: main

---

### Slide 30: Q&A

**Common Questions & Answers:**

**Q: Why is phone number optional for OAuth users?**
- A: Google doesn't provide phone numbers in profile data. We prioritize UX by making it optional, allowing users to add it later via profile update (future enhancement).

**Q: How is password security ensured?**
- A: Passwords are hashed using bcrypt with 10 salt rounds before storage. Plain passwords are never stored in the database.

**Q: What happens if JWT token expires?**
- A: User must re-authenticate (login again). Token expires after 30 days by default.

**Q: Can admin create unlimited bookings?**
- A: No, same business rules apply to all users (max 3 bookings, max 3 nights).

**Q: Why JWT instead of sessions?**
- A: JWT is stateless, scalable, and suitable for RESTful APIs. No server-side session storage required.

**Q: Why only create booking, not view/edit/delete?**
- A: Per requirements specification, only Requirements 1-3 should be implemented. Requirements 4-9 (view/edit/delete) were explicitly excluded.

---

## 📝 Presentation Tips

### Structure
1. Start with requirements (Slide 2)
2. Show architecture overview (Slide 3)
3. Focus on code changes (Slides 4-8)
4. Present diagrams (Slides 9-13)
5. Demonstrate functionality (Slide 24)
6. Conclude with summary (Slide 28)

### Key Points to Emphasize
- ✅ Requirements 1-3 fully implemented
- ✨ Google OAuth as enhancement
- 🔒 Security-first approach
- 📚 Comprehensive documentation
- 🧪 Automated testing

### What to Avoid
- Don't mention Requirements 4-9 (they're intentionally excluded)
- Don't show complex code (use simplified examples)
- Don't spend too long on any one slide
- Don't read slides verbatim

### Time Management (20-minute presentation)
- Introduction: 2 min
- Requirements: 2 min
- Code changes: 5 min
- Diagrams: 6 min
- Demo: 3 min
- Conclusion: 2 min

---

**Good Luck with Your Presentation! 🎉**
