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
//load env vars
dotenv.config({ path: './config/config.env' });


//Connect to database
connectDB();

const app = express();

//Enable CORS
app.use(cors({
    origin: '*', // Allow multiple frontend origins
    credentials: true // Allow cookies
}));

//Body parser
app.use(express.json());

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

//Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

//Cookie parser
app.use(cookieParser());

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
