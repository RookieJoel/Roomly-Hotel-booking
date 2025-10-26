# Hotel Booking System Documentation
## Software Development Practice - Assignment 7 Enhancement

---

## 📋 Table of Contents
1. [Project Requirements](#project-requirements)
2. [Code Changes](#code-changes)
3. [Use Case Diagram](#use-case-diagram)
4. [Class Diagram (UML Profile)](#class-diagram)
5. [Sequence Diagrams](#sequence-diagrams)
6. [API Documentation](#api-documentation)

---

## 1. Project Requirements (โจทย์ที่ได้รับ)

### Original Requirements (Assignment 7)
1. ✅ The system shall allow a user to register by specifying the name, telephone number, email, and password
2. ✅ After registration, the user becomes a registered user, and the system shall allow the user to log in using email and password. The system shall allow a registered user to log out
3. ✅ After login, the system shall allow the registered user to book up to 3 nights by specifying the date and the preferred hotel. The hotel list is also provided to the user

### Enhanced Features (Current Implementation)
- ✅ **Google OAuth 2.0 Integration** - Users can register/login using Google account
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - User and Admin roles
- ✅ **Enhanced Security** - Rate limiting, XSS protection, MongoDB sanitization
- ✅ **RESTful API** - Well-structured API endpoints with proper HTTP methods

---

## 2. Code Changes (โค้ดโปรแกรมที่ได้แก้ไขไปจากของเดิม)

### 2.1 Modified Files

#### **User Model (`/backend/models/User.js`)**
```javascript
// BEFORE (Assignment 7)
tel: {
    type: String,
    required: [true, 'Please add a telephone number'],
    match: [/^[0-9]{10}$/, 'Please add a valid 10-digit telephone number']
}

// AFTER (Current - Enhanced for OAuth)
tel: {
    type: String,
    required: function() {
        // Only required if not a Google OAuth user
        return !this.googleId;
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
// NEW FIELD
googleId: {
    type: String,
    unique: true,
    sparse: true
}
```

#### **Booking Model (`/backend/models/Booking.js`)**
```javascript
// NEW - Changed from Appointment to Booking
const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: true,
    },
    numOfNights: {
        type: Number,
        required: [true, 'Please add number of nights'],
        min: [1, 'Minimum booking is 1 night'],
        max: [3, 'Maximum booking is 3 nights']  // Business rule enforcement
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

#### **Hotel Model (`/backend/models/Hotel.js`)**
```javascript
// NEW - Simplified from Hospital to Hotel
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

### 2.2 New Files Added

#### **Passport Configuration (`/backend/config/passport.js`)**
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
                    let user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        return done(null, user);
                    } else {
                        const newUser = {
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            password: Math.random().toString(36).slice(-8) + 
                                     Math.random().toString(36).slice(-8),
                            googleId: profile.id,
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

### 2.3 Enhanced Routes

#### **Authentication Routes (`/backend/routes/auth.js`)**
```javascript
// NEW OAuth routes
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
```

#### **Booking Routes (`/backend/routes/bookings.js`)**
```javascript
// SIMPLIFIED - Only creation allowed (Requirements 1-3)
router.route('/').post(protect, authorize('admin','user'), addBooking);
// REMOVED: GET, PUT, DELETE operations (Requirements 4-9)
```

### 2.4 Server Configuration Changes

```javascript
// ADDED in server.js
const passport = require('passport');
require('./config/passport')(passport);
app.use(passport.initialize());

// RENAMED routes
app.use('/api/v1/hotels', hotels);      // Changed from /hospitals
app.use('/api/v1/bookings', bookings);  // Changed from /appointments
// REMOVED direct /bookings route - now nested under /hotels/:hotelId/bookings
```

---

## 3. Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hotel Booking System                         │
└─────────────────────────────────────────────────────────────────┘

        ┌──────────┐                                    ┌──────────┐
        │  Guest   │                                    │  Admin   │
        └────┬─────┘                                    └────┬─────┘
             │                                               │
             │                                               │
    ┌────────┴────────┐                            ┌────────┴────────┐
    │                 │                            │                 │
    ▼                 ▼                            ▼                 │
┌───────────┐   ┌─────────────┐           ┌─────────────┐          │
│ Register  │   │   Login     │           │   Login     │          │
│ (Basic)   │   │   (Basic)   │           │   (Basic)   │          │
└───────────┘   └──────┬──────┘           └──────┬──────┘          │
                       │                          │                 │
                       │                          │                 │
                ┌──────┴──────┐                   │                 │
                │             │                   │                 │
                ▼             ▼                   ▼                 ▼
         ┌──────────┐  ┌─────────────┐    ┌──────────────┐  ┌──────────────┐
         │ Register │  │   Login     │    │ View Hotels  │  │ Manage Hotels│
         │ (Google) │  │  (Google    │    └──────┬───────┘  └──────────────┘
         │  OAuth   │  │   OAuth)    │           │
         └──────────┘  └──────┬──────┘           │
                              │                  │
                    ┌─────────┴──────────┐       │
                    │                    │       │
                    ▼                    ▼       ▼
            ┌───────────────┐    ┌──────────────────┐
            │ View Profile  │    │  Create Booking  │
            │    (GET me)   │    │  (Max 3 nights)  │
            └───────────────┘    │ (Max 3 bookings) │
                    │            └──────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │    Logout     │
            └───────────────┘

<<include>>
    │
    ▼
┌─────────────────────┐
│ JWT Authentication  │
└─────────────────────┘
```

**Use Case Descriptions:**

1. **Register (Basic)** - User provides name, tel, email, password
2. **Register (Google OAuth)** - User authenticates via Google
3. **Login (Basic)** - User provides email and password
4. **Login (Google OAuth)** - User authenticates via Google
5. **View Hotels** - List all available hotels
6. **Create Booking** - Book hotel (max 3 nights, max 3 total bookings)
7. **View Profile** - Get current user information
8. **Logout** - Clear authentication session
9. **Manage Hotels** (Admin only) - CRUD operations on hotels

---

## 4. Class Diagram (UML Profile)

```
┌──────────────────────────────────────────────────────────────┐
│                        User                                  │
├──────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                              │
│ - name: String {required, maxLength: 50}                     │
│ - tel: String {conditional, pattern: /^[0-9]{10}$/}         │
│ - email: String {required, unique, format: email}           │
│ - password: String {required, minLength: 6, select: false}  │
│ - googleId: String {unique, sparse}                          │
│ - role: String {enum: ['user', 'admin'], default: 'user'}   │
│ - resetPasswordToken: String                                 │
│ - resetPasswordExpire: Date                                  │
│ - createdAt: Date {default: now}                            │
├──────────────────────────────────────────────────────────────┤
│ + getSignedJwtToken(): String                               │
│ + matchPassword(enteredPassword: String): Boolean           │
└──────────────────────────────────────────────────────────────┘
                    │
                    │ 1
                    │
                    │ creates
                    │
                    ▼ *
┌──────────────────────────────────────────────────────────────┐
│                       Booking                                │
├──────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                              │
│ - bookingDate: Date {required}                               │
│ - numOfNights: Number {required, min: 1, max: 3}           │
│ - user: ObjectId → User {required}                           │
│ - hotel: ObjectId → Hotel {required}                         │
│ - createdAt: Date {default: now}                            │
└──────────────────────────────────────────────────────────────┘
                    │
                    │ *
                    │
                    │ references
                    │
                    ▼ 1
┌──────────────────────────────────────────────────────────────┐
│                        Hotel                                 │
├──────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                              │
│ - name: String {required, unique, maxLength: 50}            │
│ - address: String {required}                                 │
│ - tel: String {required}                                     │
│ - createdAt: Date {default: now}                            │
├──────────────────────────────────────────────────────────────┤
│ + bookings: [Booking] {virtual}                             │
└──────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────┐
│                  <<Controller>>                              │
│                   AuthController                             │
├──────────────────────────────────────────────────────────────┤
│ + register(req, res): Response                               │
│ + login(req, res): Response                                  │
│ + getMe(req, res): Response                                  │
│ + logout(req, res): Response                                 │
│ + googleAuthCallback(req, res): Response                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  <<Controller>>                              │
│                  BookingController                           │
├──────────────────────────────────────────────────────────────┤
│ + addBooking(req, res): Response                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  <<Controller>>                              │
│                   HotelController                            │
├──────────────────────────────────────────────────────────────┤
│ + getHotels(req, res): Response                              │
│ + getHotel(req, res): Response                               │
│ + createHotel(req, res): Response {admin}                    │
│ + updateHotel(req, res): Response {admin}                    │
│ + deleteHotel(req, res): Response {admin}                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  <<Middleware>>                              │
│                 Authentication                               │
├──────────────────────────────────────────────────────────────┤
│ + protect(req, res, next): void                              │
│ + authorize(...roles): Function                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  <<Strategy>>                                │
│               GoogleOAuthStrategy                            │
├──────────────────────────────────────────────────────────────┤
│ - clientID: String                                           │
│ - clientSecret: String                                       │
│ - callbackURL: String                                        │
├──────────────────────────────────────────────────────────────┤
│ + authenticate(accessToken, refreshToken,                    │
│                profile, done): void                          │
│ + serializeUser(user, done): void                           │
│ + deserializeUser(id, done): void                           │
└──────────────────────────────────────────────────────────────┘
```

**Relationships:**
- User **1 ──── *** Booking (One user can have many bookings)
- Hotel **1 ──── *** Booking (One hotel can have many bookings)
- AuthController **uses** User Model
- BookingController **uses** Booking & Hotel Models
- GoogleOAuthStrategy **creates** User
- Authentication Middleware **protects** Controllers

---

## 5. Sequence Diagrams

### 5.1 Basic Registration & Login Sequence

```
User          Client          AuthController      User Model       Database
 │               │                  │                 │               │
 │  Fill Form    │                  │                 │               │
 ├──────────────>│                  │                 │               │
 │               │  POST /register  │                 │               │
 │               ├─────────────────>│                 │               │
 │               │                  │  Validate Data  │               │
 │               │                  ├────────────────>│               │
 │               │                  │                 │  Hash Password│
 │               │                  │                 ├──────────────>│
 │               │                  │                 │               │
 │               │                  │                 │  Save User    │
 │               │                  │                 ├──────────────>│
 │               │                  │                 │               │
 │               │                  │                 │  User Created │
 │               │                  │                 │<──────────────┤
 │               │                  │  Generate JWT   │               │
 │               │                  │<────────────────┤               │
 │               │  200 OK + Token  │                 │               │
 │               │<─────────────────┤                 │               │
 │  Show Success │                  │                 │               │
 │<──────────────┤                  │                 │               │
 │               │                  │                 │               │
 │  Login Form   │                  │                 │               │
 ├──────────────>│                  │                 │               │
 │               │  POST /login     │                 │               │
 │               ├─────────────────>│                 │               │
 │               │                  │  Find User      │               │
 │               │                  ├────────────────>│               │
 │               │                  │                 │  Query DB     │
 │               │                  │                 ├──────────────>│
 │               │                  │                 │  Return User  │
 │               │                  │                 │<──────────────┤
 │               │                  │  Match Password │               │
 │               │                  │<────────────────┤               │
 │               │                  │  Generate JWT   │               │
 │               │  200 OK + Token  │                 │               │
 │               │<─────────────────┤                 │               │
 │  Logged In    │                  │                 │               │
 │<──────────────┤                  │                 │               │
```

### 5.2 Google OAuth Authentication Sequence

```
User      Browser    AuthRoute    Passport    GoogleAPI    AuthController   UserModel    Database
 │           │           │            │            │              │            │            │
 │ Click     │           │            │            │              │            │            │
 │ "Google"  │           │            │            │              │            │            │
 ├──────────>│           │            │            │              │            │            │
 │           │ GET       │            │            │              │            │            │
 │           │ /google   │            │            │              │            │            │
 │           ├──────────>│            │            │              │            │            │
 │           │           │ Redirect   │            │              │            │            │
 │           │           │ to Google  │            │              │            │            │
 │           │           ├───────────>│            │              │            │            │
 │           │           │            │ Generate   │              │            │            │
 │           │           │            │ Auth URL   │              │            │            │
 │           │           │            ├───────────>│              │            │            │
 │           │<──────────┴────────────┴────────────┤              │            │            │
 │           │                    302 Redirect     │              │            │            │
 │  Google   │                                     │              │            │            │
 │  Login    │                                     │              │            │            │
 │  Page     │                                     │              │            │            │
 │<──────────┤                                     │              │            │            │
 │           │                                     │              │            │            │
 │ Authorize │                                     │              │            │            │
 │ App       │                                     │              │            │            │
 ├──────────>│                                     │              │            │            │
 │           │  Callback with code                 │              │            │            │
 │           ├─────────────────────────────────────>│              │            │            │
 │           │                                     │ Exchange     │            │            │
 │           │                                     │ Code for     │            │            │
 │           │                                     │ Access Token │            │            │
 │           │                                     ├─────────────>│            │            │
 │           │                                     │              │            │            │
 │           │                                     │ User Profile │            │            │
 │           │                                     │<─────────────┤            │            │
 │           │                                     │              │            │            │
 │           │           GET /callback             │              │            │            │
 │           ├──────────>│            │            │              │            │            │
 │           │           │ Verify     │            │              │            │            │
 │           │           ├───────────>│            │              │            │            │
 │           │           │            │ Check User │              │            │            │
 │           │           │            │ Exists     │              │            │            │
 │           │           │            ├────────────┼──────────────┼───────────>│            │
 │           │           │            │            │              │            │ Query      │
 │           │           │            │            │              │            ├───────────>│
 │           │           │            │            │              │            │            │
 │           │           │            │ User Not   │              │            │ Not Found  │
 │           │           │            │ Found      │              │            │<───────────┤
 │           │           │            │<───────────┼──────────────┼────────────┤            │
 │           │           │            │            │              │            │            │
 │           │           │            │ Create New │              │            │            │
 │           │           │            │ User       │              │            │            │
 │           │           │            ├────────────┼──────────────┼───────────>│            │
 │           │           │            │            │              │            │ Insert     │
 │           │           │            │            │              │            ├───────────>│
 │           │           │            │            │              │            │            │
 │           │           │            │            │              │            │ User Created│
 │           │           │            │            │              │            │<───────────┤
 │           │           │            │ User       │              │            │            │
 │           │           │            │ Object     │              │            │            │
 │           │           │            │<───────────┼──────────────┼────────────┤            │
 │           │           │            │            │              │            │            │
 │           │           │ Call       │            │              │            │            │
 │           │           │ Callback   │            │              │            │            │
 │           │           ├────────────┼────────────┼─────────────>│            │            │
 │           │           │            │            │              │            │            │
 │           │           │            │            │              │ Generate   │            │
 │           │           │            │            │              │ JWT        │            │
 │           │           │            │            │              │            │            │
 │           │           │ 200 OK     │            │              │            │            │
 │           │           │ + Token    │            │              │            │            │
 │           │<──────────┴────────────┴────────────┴──────────────┤            │            │
 │  Success  │                                     │              │            │            │
 │  Message  │                                     │              │            │            │
 │<──────────┤                                     │              │            │            │
```

### 5.3 Create Booking Sequence (Protected)

```
User      Client    AuthMiddleware  BookingController  Booking Model  Hotel Model  Database
 │           │            │                 │                │             │           │
 │ Select    │            │                 │                │             │           │
 │ Hotel     │            │                 │                │             │           │
 ├──────────>│            │                 │                │             │           │
 │           │ POST       │                 │                │             │           │
 │           │ /hotels/   │                 │                │             │           │
 │           │ :id/       │                 │                │             │           │
 │           │ bookings   │                 │                │             │           │
 │           │ + Token    │                 │                │             │           │
 │           ├───────────>│                 │                │             │           │
 │           │            │ Verify JWT      │                │             │           │
 │           │            │ Token           │                │             │           │
 │           │            │                 │                │             │           │
 │           │            │ Get User        │                │             │           │
 │           │            │ from Token      │                │             │           │
 │           │            │                 │                │             │           │
 │           │            │ next()          │                │             │           │
 │           │            ├────────────────>│                │             │           │
 │           │            │                 │ Check Hotel    │             │           │
 │           │            │                 │ Exists         │             │           │
 │           │            │                 ├────────────────┼────────────>│           │
 │           │            │                 │                │             │ Query     │
 │           │            │                 │                │             ├──────────>│
 │           │            │                 │                │             │           │
 │           │            │                 │                │             │ Hotel     │
 │           │            │                 │                │             │<──────────┤
 │           │            │                 │                │             │           │
 │           │            │                 │ Count User     │             │           │
 │           │            │                 │ Bookings       │             │           │
 │           │            │                 ├───────────────>│             │           │
 │           │            │                 │                │ Query       │           │
 │           │            │                 │                ├────────────────────────>│
 │           │            │                 │                │             │           │
 │           │            │                 │                │ Count: 2    │           │
 │           │            │                 │                │<────────────────────────┤
 │           │            │                 │                │             │           │
 │           │            │                 │ Validate       │             │           │
 │           │            │                 │ < 3 bookings   │             │           │
 │           │            │                 │ <= 3 nights    │             │           │
 │           │            │                 │                │             │           │
 │           │            │                 │ Create Booking │             │           │
 │           │            │                 ├───────────────>│             │           │
 │           │            │                 │                │ Save        │           │
 │           │            │                 │                ├────────────────────────>│
 │           │            │                 │                │             │           │
 │           │            │                 │                │ Booking     │           │
 │           │            │                 │                │ Created     │           │
 │           │            │                 │                │<────────────────────────┤
 │           │            │                 │ 200 OK         │             │           │
 │           │            │                 │ + Booking Data │             │           │
 │           │<───────────┴─────────────────┤                │             │           │
 │  Booking  │                              │                │             │           │
 │  Success  │                              │                │             │           │
 │<──────────┤                              │                │             │           │
```

---

## 6. API Documentation

### 6.1 Authentication Endpoints

#### Register (Basic)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "tel": "0812345678",
  "email": "john@example.com",
  "password": "password123"
}

Response 200 OK:
{
  "success": true,
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login (Basic)
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response 200 OK:
{
  "success": true,
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Google OAuth Login
```http
GET /api/v1/auth/google
// Redirects to Google authentication
```

#### Google OAuth Callback
```http
GET /api/v1/auth/google/callback
// Handled by Passport, returns token
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {token}

Response 200 OK:
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "tel": "0812345678",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-10-26T00:00:00.000Z"
  }
}
```

#### Logout
```http
GET /api/v1/auth/logout

Response 200 OK:
{
  "success": true,
  "data": {}
}
```

### 6.2 Hotel Endpoints

#### Get All Hotels
```http
GET /api/v1/hotels

Response 200 OK:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "hotel_id_1",
      "name": "Grand Hotel",
      "address": "123 Main St, Bangkok",
      "tel": "0212345678"
    },
    {
      "_id": "hotel_id_2",
      "name": "Beach Resort",
      "address": "456 Beach Rd, Phuket",
      "tel": "0298765432"
    }
  ]
}
```

#### Get Single Hotel
```http
GET /api/v1/hotels/:id

Response 200 OK:
{
  "success": true,
  "data": {
    "_id": "hotel_id",
    "name": "Grand Hotel",
    "address": "123 Main St, Bangkok",
    "tel": "0212345678"
  }
}
```

### 6.3 Booking Endpoints

#### Create Booking
```http
POST /api/v1/hotels/:hotelId/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingDate": "2025-11-15",
  "numOfNights": 2
}

Response 200 OK:
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "bookingDate": "2025-11-15T00:00:00.000Z",
    "numOfNights": 2,
    "user": "user_id",
    "hotel": "hotel_id",
    "createdAt": "2025-10-26T00:00:00.000Z"
  }
}
```

**Business Rules:**
- Maximum 3 nights per booking
- Maximum 3 total bookings per user
- Requires authentication

### 6.4 Error Responses

```json
// 400 Bad Request
{
  "success": false,
  "msg": "Validation error message"
}

// 401 Unauthorized
{
  "success": false,
  "msg": "Not authorized to access this route"
}

// 404 Not Found
{
  "success": false,
  "msg": "Resource not found"
}

// 500 Server Error
{
  "success": false,
  "msg": "Server error message"
}
```

---

## 7. Security Features

### Implemented Security Measures

1. **JWT Authentication** - Secure token-based authentication
2. **Password Hashing** - bcrypt with salt rounds
3. **Rate Limiting** - 100 requests per 10 minutes per IP
4. **MongoDB Sanitization** - Prevents NoSQL injection
5. **XSS Protection** - express-xss-sanitizer
6. **Security Headers** - Helmet.js
7. **CORS** - Configured for cross-origin requests
8. **OAuth 2.0** - Secure third-party authentication

---

## 8. Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v5
- **Database**: MongoDB (Atlas)
- **ODM**: Mongoose v8
- **Authentication**: 
  - JWT (jsonwebtoken)
  - Passport.js
  - passport-google-oauth20
- **Security**: 
  - bcryptjs
  - helmet
  - express-rate-limit
  - express-mongo-sanitize
  - express-xss-sanitizer
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)

### Dependencies
```json
{
  "bcryptjs": "^3.0.2",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^17.2.1",
  "express": "^5.1.0",
  "express-mongo-sanitize": "^2.2.0",
  "express-rate-limit": "^8.1.0",
  "express-xss-sanitizer": "^2.0.1",
  "helmet": "^8.1.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.18.0",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "express-session": "^1.18.0",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1"
}
```

---

## 9. Testing Documentation

### Test Files Provided
1. **Postman Collection** - `Hotel_Booking_Auth_Tests.postman_collection.json`
2. **HTML Test Interface** - `test-auth.html`
3. **Testing Guide** - `API_TESTING_GUIDE.md`
4. **Quick Reference** - `QUICK_TEST_REFERENCE.md`

### Test Coverage
- ✅ User Registration (Basic & OAuth)
- ✅ User Login (Basic & OAuth)
- ✅ Protected Routes (JWT verification)
- ✅ Booking Creation
- ✅ Hotel Listing
- ✅ Error Handling
- ✅ Validation Rules

---

## 10. Project Structure

```
Roomly-Hotel-booking/
├── backend/
│   ├── config/
│   │   ├── config.env          # Environment variables
│   │   ├── db.js               # MongoDB connection
│   │   └── passport.js         # Google OAuth configuration
│   ├── controllers/
│   │   ├── auth.js             # Authentication logic
│   │   ├── bookings.js         # Booking operations
│   │   └── hotels.js           # Hotel operations
│   ├── middleware/
│   │   └── auth.js             # JWT & authorization middleware
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Booking.js          # Booking schema
│   │   └── Hotel.js            # Hotel schema
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── bookings.js         # Booking routes
│   │   └── hotels.js           # Hotel routes
│   └── server.js               # Express app entry point
├── test-auth.html              # HTML test interface
├── Hotel_Booking_Auth_Tests.postman_collection.json
├── API_TESTING_GUIDE.md
├── GOOGLE_OAUTH_GUIDE.md
├── GOOGLE_OAUTH_QUICKSTART.md
└── QUICK_TEST_REFERENCE.md
```

---

## 11. Key Changes Summary

### What Changed from Assignment 7

| Aspect | Before (Assignment 7) | After (Current) |
|--------|----------------------|-----------------|
| **Authentication** | Basic only | Basic + Google OAuth |
| **Phone Requirement** | Always required | Optional for OAuth users |
| **Models** | Hospital, Appointment | Hotel, Booking |
| **Booking Features** | View/Edit/Delete | Create only (Requirements 1-3) |
| **Security** | Basic | Enhanced (Rate limiting, XSS, etc.) |
| **Documentation** | Minimal | Comprehensive (Swagger, Guides) |
| **Testing** | Manual | Automated (Postman, HTML interface) |

---

## 12. Future Enhancements (Not Implemented)

These features were intentionally removed per requirements:
- ❌ View bookings (Requirement 4)
- ❌ Edit bookings (Requirement 5)
- ❌ Delete bookings (Requirement 6)
- ❌ Admin view all bookings (Requirement 7)
- ❌ Admin edit bookings (Requirement 8)
- ❌ Admin delete bookings (Requirement 9)

Could be added later:
- Phone number update endpoint for OAuth users
- Email verification
- Password reset functionality
- Booking payment integration
- Hotel search and filtering
- User reviews and ratings

---

## 13. Conclusion

This Hotel Booking System successfully implements:
1. ✅ **Requirements 1-3** as specified
2. ✅ **Google OAuth 2.0** integration for modern authentication
3. ✅ **Enhanced security** measures
4. ✅ **RESTful API** design
5. ✅ **Comprehensive documentation** and testing tools

The system is production-ready with proper error handling, validation, and security measures in place.

---

**Documentation Generated:** October 26, 2025  
**Project:** Hotel Booking System  
**Course:** Software Development Practice  
**Assignment:** 7 (Enhanced)
