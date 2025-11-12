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

## 2. Google OAuth Authentication Sequence (Enhanced Security)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant AuthRoute
    participant Session
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
    
    AuthRoute->>AuthRoute: Generate CSRF state token
    Note over AuthRoute: crypto.randomBytes(32).toString('hex')<br/>64 character random string
    
    AuthRoute->>Session: Store state in session
    activate Session
    Session-->>AuthRoute: State saved
    deactivate Session
    
    AuthRoute->>Passport: authenticate('google', {state})
    activate Passport
    
    Passport->>GoogleAPI: Redirect with state parameter
    activate GoogleAPI
    Note over Passport,GoogleAPI: scope: ['profile', 'email']<br/>accessType: 'offline'<br/>prompt: 'consent'<br/>state: {random64charString}
    
    Browser->>GoogleAPI: User authorizes app
    Note over User,GoogleAPI: User grants profile & email access
    
    GoogleAPI-->>Browser: 302 Redirect with code + state
    deactivate GoogleAPI
    Note over GoogleAPI,Browser: /callback?code=xxx&state=xxx
    
    Browser->>AuthRoute: GET /api/v1/auth/google/callback?code=xxx&state=xxx
    deactivate Browser
    
    AuthRoute->>AuthRoute: Verify rate limit (10/15min)
    
    AuthRoute->>Session: Retrieve stored state
    activate Session
    Session-->>AuthRoute: Original state
    deactivate Session
    
    AuthRoute->>AuthRoute: Compare states
    Note over AuthRoute: CSRF Protection:<br/>req.query.state === req.session.oauthState
    
    alt State mismatch
        AuthRoute-->>Browser: 403 Forbidden
        activate Browser
        Browser->>User: Show "Security error"
        deactivate Browser
    else State valid
        AuthRoute->>Passport: authenticate('google')
        
        Passport->>GoogleAPI: Exchange code for token
        activate GoogleAPI
        GoogleAPI-->>Passport: Access token
        deactivate GoogleAPI
        
        Passport->>GoogleAPI: Get user profile
        activate GoogleAPI
        GoogleAPI-->>Passport: Profile data
        deactivate GoogleAPI
        Note over GoogleAPI,Passport: {id, emails, name, photos}
        
        Passport->>Strategy: Call verify callback
        activate Strategy
        Note over Passport,Strategy: passReqToCallback: true<br/>req, accessToken, refreshToken, profile, done
        
        Strategy->>Strategy: Validate email exists
        Note over Strategy: Check profile.emails exists
        
        alt No email in profile
            Strategy-->>Passport: done(error, null)
            Passport-->>AuthRoute: Authentication failed
            AuthRoute-->>Browser: 401 Unauthorized
            activate Browser
            Browser->>User: Show "Email required"
            deactivate Browser
        else Email exists
            Strategy->>Strategy: Verify email verified status
            Note over Strategy: Check emails[0].verified === true
            
            alt Email not verified
                Strategy-->>Passport: done(error, null)
                Passport-->>AuthRoute: Authentication failed
                AuthRoute-->>Browser: 403 Forbidden
                activate Browser
                Browser->>User: Show "Email not verified by Google"
                deactivate Browser
            else Email verified
                Strategy->>UserModel: findOne({googleId: profile.id})
                activate UserModel
                UserModel->>Database: Query by googleId
                activate Database
                
                alt User found by googleId
                    Database-->>UserModel: User document
                else Not found by googleId
                    Database-->>UserModel: null
                    UserModel->>Database: findOne({email: profile.email})
                    
                    alt User found by email
                        Database-->>UserModel: User document
                        UserModel->>UserModel: Update googleId
                        Note over UserModel: Link Google account to existing user
                        UserModel->>Database: Save updated user
                    else User not found
                        Database-->>UserModel: null
                        UserModel->>UserModel: Generate secure password
                        Note over UserModel: crypto.randomBytes(32).toString('hex')<br/>64 character random password
                        
                        UserModel->>UserModel: Create new user
                        Note over UserModel: name: profile.displayName<br/>email: profile.emails[0].value<br/>googleId: profile.id<br/>password: {secureRandom}<br/>tel: '0000000000'
                        
                        UserModel->>Database: Save new user
                        Database-->>UserModel: User created
                    end
                end
                
                deactivate Database
                UserModel-->>Strategy: User object
                deactivate UserModel
                
                Strategy-->>Passport: done(null, user)
                deactivate Strategy
                
                Passport-->>AuthRoute: req.user = user
                deactivate Passport
                
                AuthRoute->>JWT: Generate token
                activate JWT
                Note over JWT: Payload: {id: user._id}<br/>Expiry: 30 days
                JWT-->>AuthRoute: JWT token
                deactivate JWT
                
                AuthRoute->>AuthRoute: Set HTTP-only cookie
                Note over AuthRoute: Cookie options:<br/>httpOnly: true<br/>secure: production<br/>sameSite: 'lax'<br/>maxAge: 30 days
                
                AuthRoute->>Session: Clear OAuth state
                activate Session
                Session-->>AuthRoute: State cleared
                deactivate Session
                
                AuthRoute-->>Browser: 302 Redirect to frontend
                activate Browser
                Note over AuthRoute,Browser: URL: /google-auth-success?userData={...}<br/>Cookie: token={JWT}<br/>userData includes fallback token
                
                Browser->>Browser: Read token from cookie
                Note over Browser: Primary: document.cookie<br/>Fallback: URL parameter
                
                alt Token found in cookie
                    Browser->>Browser: Store token in localStorage
                    Browser->>User: Redirect based on tel
                    Note over Browser,User: tel === '0000000000' → /complete-profile<br/>else → /hotels
                else Token not in cookie
                    Browser->>Browser: Use fallback from URL
                    Browser->>User: Same redirect logic
                end
                deactivate Browser
            end
        end
        deactivate AuthRoute
    end
```

**Enhanced Flow Description:**

### Phase 1: OAuth Initiation with CSRF Protection
1. User clicks "Sign in with Google" button
2. Browser requests `/api/v1/auth/google`
3. **CSRF State Generation:** Server generates cryptographically secure 64-character random state
4. **Session Storage:** State is stored in server-side session (10-minute expiry)
5. Passport redirects to Google with state parameter

### Phase 2: Google Authorization
6. User is redirected to Google consent screen
7. User grants permissions (profile, email)
8. Google redirects back with authorization code AND state parameter

### Phase 3: Security Validation
9. **Rate Limiting Check:** Maximum 10 OAuth attempts per 15 minutes per IP
10. **State Retrieval:** Server retrieves original state from session
11. **CSRF Verification:** Compare `req.query.state` with `req.session.oauthState`
    - If mismatch → 403 Forbidden (CSRF attack prevented)
    - If match → Continue

### Phase 4: Token Exchange & Profile Retrieval
12. Passport exchanges authorization code for access token
13. Passport fetches user profile from Google API

### Phase 5: Email Validation
14. **Email Existence Check:** Verify `profile.emails` exists
    - If missing → 401 Unauthorized
15. **Email Verification Check:** Verify `profile.emails[0].verified === true`
    - If not verified → 403 Forbidden
    - Only accepts Google-verified emails

### Phase 6: User Lookup Strategy (Dual-Method)
16. **Primary Lookup:** Search by `googleId`
    - If found → Use existing user
17. **Secondary Lookup:** If not found by googleId, search by `email`
    - If found → Link Google account (update `googleId` field)
18. **User Creation:** If neither found:
    - Generate secure random password using `crypto.randomBytes(32)` (64 chars)
    - Create new user with:
      - `name`: From Google profile
      - `email`: From Google (verified)
      - `googleId`: From Google
      - `password`: Secure random (bcrypt hashed)
      - `tel`: Default '0000000000' (requires completion)

### Phase 7: JWT Generation & Cookie Security
19. Generate JWT token with 30-day expiration
20. **HTTP-only Cookie:** Set secure cookie with:
    - `httpOnly: true` → Prevents XSS attacks
    - `secure: true` → HTTPS only (production)
    - `sameSite: 'lax'` → Allows OAuth redirects, prevents CSRF
    - `maxAge: 30 days` → Long-term authentication

### Phase 8: Session Cleanup & Redirect
21. Clear OAuth state from session (no longer needed)
22. Redirect to frontend with:
    - **Primary:** JWT in HTTP-only cookie
    - **Fallback:** JWT in URL parameter (development/debugging)

### Phase 9: Frontend Token Handling
23. Frontend attempts to read token from cookie
24. If cookie not accessible, uses fallback from URL
25. Stores token in localStorage for API requests
26. Redirects based on profile completion:
    - `tel === '0000000000'` → `/complete-profile`
    - Otherwise → `/hotels`

---

**Key Security Features:**

### 🔒 CSRF Protection
- **State Parameter:** 64-character cryptographically secure random string
- **Session Storage:** State stored server-side, not in cookie
- **Verification:** State must match on callback, prevents CSRF attacks

### 🔒 Email Verification
- **Trusted Source:** Only accepts Google-verified emails
- **Profile Check:** Verifies `profile.emails[0].verified === true`
- **Prevents:** Fake email registration

### 🔒 Rate Limiting
- **OAuth Endpoint:** 10 requests per 15 minutes per IP
- **Prevents:** Brute force and DoS attacks

### 🔒 Secure Cookie Configuration
- **httpOnly:** JavaScript cannot access token (XSS protection)
- **secure:** HTTPS only in production (MITM protection)
- **sameSite: 'lax':** Allows OAuth redirects, blocks CSRF

### 🔒 Secure Password Generation
- **Method:** `crypto.randomBytes(32).toString('hex')`
- **Length:** 64 characters hexadecimal
- **Entropy:** 256 bits of randomness
- **Purpose:** OAuth users never use this, but it's secure if needed

### 🔒 User Lookup Strategy
- **Primary:** GoogleId (direct OAuth identifier)
- **Fallback:** Email (allows account linking)
- **Update:** Links Google account if found by email only
- **Prevents:** Duplicate accounts for same user

### 🔒 Session Management
- **Duration:** 10 minutes for OAuth flow
- **Purpose:** Store state parameter securely
- **Cleanup:** State cleared after successful authentication

---

**Error Handling:**

| Error Code | Scenario | Message |
|------------|----------|---------|
| 403 Forbidden | State mismatch (CSRF) | "Invalid state parameter" |
| 403 Forbidden | Email not verified by Google | "Please verify your email with Google" |
| 401 Unauthorized | No email in profile | "Email is required for authentication" |
| 429 Too Many Requests | Rate limit exceeded | "Too many OAuth attempts. Try again later." |

---

**Business Rules:**

✅ User must use Google-verified email only  
✅ Maximum 10 OAuth attempts per 15 minutes  
✅ State parameter must match (CSRF protection)  
✅ OAuth users get default tel: '0000000000' → Must complete profile  
✅ Existing accounts can be linked via email  
✅ Token stored in HTTP-only cookie (primary method)  
✅ URL parameter used as fallback for development

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
