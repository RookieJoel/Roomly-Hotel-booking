const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const passport = require('passport');
const session = require('express-session');
const { doubleCsrf } = require('csrf-csrf');
const path = require('path');

//load env vars
dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

//Connect to database
connectDB();

const app = express();

// Passport config
require('./config/passport')(passport);

//Enable CORS - BEST PRACTICE: Specify exact origins instead of wildcard
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173', // Development
    'http://localhost:3000'  // Alternative dev port
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // REQUIRED: Allow cookies to be sent with requests
    exposedHeaders: ['set-cookie'] // Allow frontend to read set-cookie header
}));

//Body parser
app.use(express.json());

// Session configuration - REQUIRED for OAuth state parameter
// IMPORTANT: Must be before passport.initialize()
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 10 * 60 * 1000 // 10 minutes - enough for OAuth flow
    }
}));

// Initialize Passport
// CRITICAL: passport.session() must be called AFTER passport.initialize()
app.use(passport.initialize());
app.use(passport.session()); // REQUIRED for persistent login sessions

//Sanitize data (wrap to avoid throwing when req.query is a getter-only property)
app.use((req, res, next) => {
  try {
    // try the standard middleware
    mongoSanitize()(req, res, next);
  } catch (err) {
    // If sanitizing req.query causes a TypeError (some environments make req.query getter-only)
    // fall back to a safe sanitizer that only removes keys starting with `$` or containing `.`
    const safeSanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach((key) => {
        if (key.startsWith('$') || key.indexOf('.') !== -1) {
          delete obj[key];
        } else {
          safeSanitize(obj[key]);
        }
      });
    };

    try {
      safeSanitize(req.body);
      safeSanitize(req.params);
      // don't mutate req.query because it may be getter-only in this runtime
    } catch (e) {
      // ignore any errors during fallback sanitize
    }
    return next();
  }
});

//Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

//Rate limiting - General
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Specific rate limiting for authentication routes (disabled for newman testing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit for testing
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

//Cookie parser
app.use(cookieParser());

// CSRF Protection (configured for stateless tokens)
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || 'your-csrf-secret-key',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token']
});

// Endpoint to generate CSRF token
app.get('/api/v1/csrf-token', (req, res) => {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
});

// Swagger setup using swagger-jsdoc + swagger-ui-express
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Booking API',
      version: '1.0.0',
      description: 'A simple Express Hotel Booking API'
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5000}/api/v1` }
    ],
    components: {
      schemas: {
        Hotel: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            tel: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
      }
    }
  },
  // files containing annotations as above
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Serve API docs (OpenAPI/Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Mount routers
const hotels = require('./routes/hotels');
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');

// Apply rate limiting to auth routes
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/forgotpassword', authLimiter);

// Apply CSRF protection to state-changing routes (can be applied selectively)
// Note: For APIs with JWT tokens, CSRF is less critical, but adds defense in depth
app.use('/api/v1/auth', auth);
app.use('/api/v1/hotels', hotels);
app.use('/api/v1/bookings', bookings);

// Generic error handler - return JSON instead of HTML on errors
app.use((err, req, res, next) => {
  console.error('Unhandled error middleware:', err && err.stack ? err.stack : err);
  const statusCode = err && err.status ? err.status : 500;
  res.status(statusCode).json({ success: false, error: err && err.message ? err.message : 'Server Error' });
});

const PORT = process.env.PORT || 5003;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(() => process.exit(1));
}); 
