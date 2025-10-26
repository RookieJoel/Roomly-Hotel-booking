# Sequence Diagrams - Hotel Booking System

## 1. Basic Registration & Login Sequence

### 1.1 User Registration (Basic Auth)

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant AuthController
    participant UserModel
    participant Database
    participant JWT

    User->>Client: Fill registration form
    activate Client
    Note over User,Client: name, tel, email, password
    
    Client->>AuthController: POST /api/v1/auth/register
    activate AuthController
    Note over Client,AuthController: {name, tel, email, password}
    
    AuthController->>AuthController: Validate input
    
    AuthController->>UserModel: Create user
    activate UserModel
    
    UserModel->>UserModel: Validate schema
    UserModel->>UserModel: Hash password (bcrypt)
    
    UserModel->>Database: Save user
    activate Database
    Database-->>UserModel: User created
    deactivate Database
    
    UserModel-->>AuthController: User object
    deactivate UserModel
    
    AuthController->>JWT: Generate token
    activate JWT
    JWT-->>AuthController: JWT token
    deactivate JWT
    
    AuthController->>Client: 200 OK + {success, user, token}
    deactivate AuthController
    
    Client->>Client: Store token
    Client->>User: Show success message
    deactivate Client
```

**Flow Description:**
1. User fills registration form with name, tel, email, password
2. Client sends POST request to `/api/v1/auth/register`
3. AuthController validates input data
4. UserModel validates schema constraints:
   - Name: required, max 50 chars
   - Tel: required, 10 digits (for basic auth)
   - Email: required, unique, valid format
   - Password: required, min 6 chars
5. UserModel hashes password using bcrypt
6. UserModel saves to database
7. JWT token is generated with user ID
8. Response returns user data and token
9. Client stores token for future requests

---

### 1.2 User Login (Basic Auth)

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant AuthController
    participant UserModel
    participant Database
    participant JWT

    User->>Client: Enter email & password
    activate Client
    
    Client->>AuthController: POST /api/v1/auth/login
    activate AuthController
    Note over Client,AuthController: {email, password}
    
    AuthController->>AuthController: Validate input
    
    AuthController->>UserModel: Find user by email
    activate UserModel
    
    UserModel->>Database: Query {email}
    activate Database
    Database-->>UserModel: User document (with password)
    deactivate Database
    
    UserModel-->>AuthController: User object
    deactivate UserModel
    
    AuthController->>UserModel: matchPassword(password)
    activate UserModel
    UserModel->>UserModel: bcrypt.compare()
    UserModel-->>AuthController: true/false
    deactivate UserModel
    
    alt Password matches
        AuthController->>JWT: Generate token
        activate JWT
        JWT-->>AuthController: JWT token
        deactivate JWT
        
        AuthController->>Client: 200 OK + {success, user, token}
        Client->>Client: Store token
        Client->>User: Redirect to dashboard
    else Password doesn't match
        AuthController->>Client: 401 Unauthorized
        Client->>User: Show error message
    end
    
    deactivate AuthController
    deactivate Client
```

**Flow Description:**
1. User enters email and password
2. Client sends POST request to `/api/v1/auth/login`
3. AuthController validates input
4. UserModel queries database by email
5. Password is verified using bcrypt comparison
6. If match: JWT token generated and returned
7. If no match: 401 Unauthorized error
8. Client stores token on success

---

## 2. Google OAuth Authentication Sequence

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant AuthRoute
    participant Passport
    participant GoogleAPI
    participant Strategy
    participant UserModel
    participant Database
    participant JWT

    User->>Browser: Click "Sign in with Google"
    activate Browser
    
    Browser->>AuthRoute: GET /api/v1/auth/google
    activate AuthRoute
    
    AuthRoute->>Passport: authenticate('google')
    activate Passport
    
    Passport->>GoogleAPI: Redirect to consent screen
    activate GoogleAPI
    
    Browser->>GoogleAPI: User authorizes app
    Note over User,GoogleAPI: User grants profile & email access
    
    GoogleAPI-->>Browser: 302 Redirect with code
    deactivate GoogleAPI
    
    Browser->>AuthRoute: GET /api/v1/auth/google/callback?code=xxx
    deactivate Browser
    
    AuthRoute->>Passport: authenticate('google')
    
    Passport->>GoogleAPI: Exchange code for token
    activate GoogleAPI
    GoogleAPI-->>Passport: Access token & profile
    deactivate GoogleAPI
    
    Passport->>Strategy: Call verify callback
    activate Strategy
    Note over Passport,Strategy: profile: {id, email, name}
    
    Strategy->>UserModel: findOne({email})
    activate UserModel
    UserModel->>Database: Query user
    activate Database
    
    alt User exists
        Database-->>UserModel: User found
        UserModel-->>Strategy: Existing user
    else User not found
        Database-->>UserModel: null
        UserModel->>UserModel: Create user
        Note over UserModel: name, email, googleId,<br/>random password
        UserModel->>Database: Save new user
        Database-->>UserModel: User created
        UserModel-->>Strategy: New user
    end
    
    deactivate Database
    deactivate UserModel
    
    Strategy-->>Passport: done(null, user)
    deactivate Strategy
    
    Passport-->>AuthRoute: req.user = user
    deactivate Passport
    
    AuthRoute->>JWT: Generate token
    activate JWT
    JWT-->>AuthRoute: JWT token
    deactivate JWT
    
    AuthRoute-->>Browser: 200 OK + {success, user, token}
    activate Browser
    Browser->>Browser: Store token
    Browser->>User: Show success / redirect
    deactivate Browser
    deactivate AuthRoute
```

**Flow Description:**
1. User clicks "Sign in with Google" button
2. Browser redirects to `/api/v1/auth/google`
3. Passport generates Google OAuth URL
4. User is redirected to Google consent screen
5. User grants permissions (profile, email)
6. Google redirects back with authorization code
7. Passport exchanges code for access token
8. Passport retrieves user profile from Google
9. Strategy checks if user exists by email:
   - **If exists:** Return existing user
   - **If not exists:** Create new user with:
     - `name` from Google profile
     - `email` from Google profile
     - `googleId` from Google profile
     - Random password (not used)
     - `tel` is optional (not required for OAuth)
10. JWT token is generated with user ID
11. Response returns user data and token
12. Browser stores token

**Key Points:**
- No password required from user
- Phone number (`tel`) is optional for OAuth users
- `googleId` is stored for future authentication
- Email is used as unique identifier

---

## 3. Create Booking Sequence (Protected Route)

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant AuthMiddleware
    participant BookingController
    participant HotelModel
    participant BookingModel
    participant Database

    User->>Client: Select hotel & dates
    activate Client
    Note over User,Client: Hotel ID, date, nights
    
    Client->>AuthMiddleware: POST /api/v1/hotels/:hotelId/bookings
    activate AuthMiddleware
    Note over Client,AuthMiddleware: Headers: Authorization: Bearer {token}<br/>Body: {bookingDate, numOfNights}
    
    AuthMiddleware->>AuthMiddleware: Extract JWT from header
    AuthMiddleware->>AuthMiddleware: Verify & decode token
    
    AuthMiddleware->>Database: Find user by ID from token
    activate Database
    Database-->>AuthMiddleware: User object
    deactivate Database
    
    alt Token valid
        AuthMiddleware->>AuthMiddleware: Attach user to req.user
        AuthMiddleware->>BookingController: next()
        deactivate AuthMiddleware
        activate BookingController
        
        BookingController->>HotelModel: findById(hotelId)
        activate HotelModel
        HotelModel->>Database: Query hotel
        activate Database
        Database-->>HotelModel: Hotel document
        deactivate Database
        HotelModel-->>BookingController: Hotel object
        deactivate HotelModel
        
        alt Hotel exists
            BookingController->>BookingModel: countDocuments({user: userId})
            activate BookingModel
            BookingModel->>Database: Count query
            activate Database
            Database-->>BookingModel: Booking count
            deactivate Database
            BookingModel-->>BookingController: Count (e.g., 2)
            deactivate BookingModel
            
            alt Count < 3
                BookingController->>BookingController: Validate numOfNights (1-3)
                
                alt Nights valid
                    BookingController->>BookingModel: Create booking
                    activate BookingModel
                    Note over BookingController,BookingModel: {bookingDate, numOfNights,<br/>user: userId, hotel: hotelId}
                    
                    BookingModel->>BookingModel: Validate schema
                    BookingModel->>Database: Save booking
                    activate Database
                    Database-->>BookingModel: Booking created
                    deactivate Database
                    
                    BookingModel-->>BookingController: Booking object
                    deactivate BookingModel
                    
                    BookingController->>Client: 200 OK + {success, data: booking}
                    Client->>User: Show confirmation
                else Nights invalid
                    BookingController->>Client: 400 Bad Request
                    Note over Client,BookingController: "Nights must be 1-3"
                    Client->>User: Show error
                end
            else Count >= 3
                BookingController->>Client: 400 Bad Request
                Note over Client,BookingController: "Max 3 bookings allowed"
                Client->>User: Show error
            end
        else Hotel not found
            BookingController->>Client: 404 Not Found
            Client->>User: Show error
        end
        
        deactivate BookingController
    else Token invalid
        AuthMiddleware->>Client: 401 Unauthorized
        deactivate AuthMiddleware
        Client->>User: Redirect to login
    end
    
    deactivate Client
```

**Flow Description:**
1. User selects hotel and booking details (date, nights)
2. Client sends POST request with JWT token in header
3. **AuthMiddleware Protection:**
   - Extracts token from Authorization header
   - Verifies token signature
   - Decodes user ID from token
   - Loads user from database
   - Attaches user to `req.user`
   - If invalid: Returns 401 Unauthorized
4. **BookingController Business Logic:**
   - Validates hotel exists by ID
   - Counts user's existing bookings
   - Validates max 3 bookings rule
   - Validates numOfNights (1-3)
   - Creates booking in database
5. **Success Response:**
   - Returns booking data with 200 OK
   - Client shows confirmation to user

**Business Rules Enforced:**
- ✅ User must be authenticated (JWT required)
- ✅ Hotel must exist
- ✅ Maximum 3 bookings per user
- ✅ Minimum 1 night, maximum 3 nights per booking

**Error Scenarios:**
- 401: Invalid or missing token
- 404: Hotel not found
- 400: Exceeded booking limit (3 max)
- 400: Invalid number of nights (must be 1-3)

---

## 4. Get Current User (Protected Route)

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant AuthMiddleware
    participant AuthController
    participant Database

    User->>Client: Request profile
    activate Client
    
    Client->>AuthMiddleware: GET /api/v1/auth/me
    activate AuthMiddleware
    Note over Client,AuthMiddleware: Headers: Authorization: Bearer {token}
    
    AuthMiddleware->>AuthMiddleware: Extract & verify JWT
    
    AuthMiddleware->>Database: Find user by ID
    activate Database
    Database-->>AuthMiddleware: User document
    deactivate Database
    
    AuthMiddleware->>AuthMiddleware: Attach user to req.user
    AuthMiddleware->>AuthController: next()
    deactivate AuthMiddleware
    activate AuthController
    
    AuthController->>Client: 200 OK + {success, data: user}
    deactivate AuthController
    Note over Client: User data (password excluded)
    
    Client->>User: Display profile
    deactivate Client
```

---

## 5. Logout Sequence

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant AuthController

    User->>Client: Click logout
    activate Client
    
    Client->>AuthController: GET /api/v1/auth/logout
    activate AuthController
    
    AuthController->>AuthController: Set cookie expiration
    
    AuthController->>Client: 200 OK + {success, data: {}}
    deactivate AuthController
    
    Client->>Client: Remove token from storage
    Client->>User: Redirect to home
    deactivate Client
```

---

## 6. Admin Create Hotel (Protected & Authorized)

```mermaid
sequenceDiagram
    actor Admin
    participant Client
    participant AuthMiddleware
    participant AuthorizeMiddleware
    participant HotelController
    participant HotelModel
    participant Database

    Admin->>Client: Fill hotel form
    activate Client
    
    Client->>AuthMiddleware: POST /api/v1/hotels
    activate AuthMiddleware
    Note over Client,AuthMiddleware: Headers: Authorization: Bearer {token}<br/>Body: {name, address, tel}
    
    AuthMiddleware->>AuthMiddleware: Verify JWT & load user
    
    alt Token valid
        AuthMiddleware->>AuthorizeMiddleware: next()
        deactivate AuthMiddleware
        activate AuthorizeMiddleware
        
        AuthorizeMiddleware->>AuthorizeMiddleware: Check user.role
        
        alt Role is 'admin'
            AuthorizeMiddleware->>HotelController: next()
            deactivate AuthorizeMiddleware
            activate HotelController
            
            HotelController->>HotelModel: Create hotel
            activate HotelModel
            
            HotelModel->>HotelModel: Validate schema
            HotelModel->>Database: Save hotel
            activate Database
            Database-->>HotelModel: Hotel created
            deactivate Database
            
            HotelModel-->>HotelController: Hotel object
            deactivate HotelModel
            
            HotelController->>Client: 201 Created + hotel data
            deactivate HotelController
            Client->>Admin: Show success
        else Role is not 'admin'
            AuthorizeMiddleware->>Client: 403 Forbidden
            deactivate AuthorizeMiddleware
            Note over Client: "Not authorized as admin"
            Client->>Admin: Show error
        end
    else Token invalid
        AuthMiddleware->>Client: 401 Unauthorized
        deactivate AuthMiddleware
        Client->>Admin: Redirect to login
    end
    
    deactivate Client
```

**Flow Description:**
1. Admin fills hotel creation form
2. Request sent with JWT token
3. **AuthMiddleware:** Verifies token and loads user
4. **AuthorizeMiddleware:** Checks if `user.role === 'admin'`
5. If authorized: Hotel is created
6. If not admin: 403 Forbidden error
7. If token invalid: 401 Unauthorized error

---

## Sequence Diagram Notes

### Key Patterns

1. **Authentication Pattern (Protect):**
   ```
   Client → AuthMiddleware → Controller
   ```
   - Validates JWT token
   - Loads user from database
   - Attaches user to request

2. **Authorization Pattern (Authorize):**
   ```
   Client → AuthMiddleware → AuthorizeMiddleware → Controller
   ```
   - First authenticates user
   - Then checks role permissions

3. **Business Validation Pattern:**
   ```
   Controller → Model → Database
   ```
   - Controller implements business rules
   - Model validates schema constraints
   - Database ensures data integrity

### Error Handling

- **401 Unauthorized:** Token missing/invalid/expired
- **403 Forbidden:** User lacks required role
- **400 Bad Request:** Validation error (e.g., max bookings)
- **404 Not Found:** Resource doesn't exist
- **500 Server Error:** Database or system error

### Token Flow

1. User authenticates (register/login/OAuth)
2. Server generates JWT token
3. Client stores token (localStorage/cookie)
4. Client includes token in subsequent requests:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Server verifies token on protected routes

---

## Comparison with Assignment 7

### Changes from Original

| Aspect | Assignment 7 | Current Implementation |
|--------|-------------|------------------------|
| **Registration** | Basic only | Basic + Google OAuth |
| **Token Type** | Session-based | JWT (stateless) |
| **Models** | Hospital, Appointment | Hotel, Booking |
| **Booking Operations** | Full CRUD | Create only |
| **Authentication Flow** | Simple | Enhanced with middleware |
| **Authorization** | Basic | Role-based (RBAC) |

### New Sequences Added

1. ✅ Google OAuth authentication flow
2. ✅ JWT token verification in middleware
3. ✅ Role-based authorization for admin routes
4. ✅ Enhanced error handling

### Removed Sequences

These sequences are NOT implemented (Requirements 4-9):
- ❌ View all user bookings
- ❌ View single booking
- ❌ Update booking
- ❌ Delete booking
- ❌ Admin view all bookings
- ❌ Admin update booking
- ❌ Admin delete booking

---

## Notes for Presentation

1. **Focus on Requirements 1-3:**
   - Registration (Basic & OAuth)
   - Login (Basic & OAuth)
   - Create Booking (protected)

2. **Highlight Security:**
   - JWT authentication
   - Password hashing
   - Role-based access control
   - Token expiration

3. **Show Business Rules:**
   - Max 3 bookings per user
   - Max 3 nights per booking
   - Admin-only hotel management

4. **OAuth Enhancement:**
   - Seamless Google sign-in
   - No password required
   - Optional phone number
   - Automatic user creation
