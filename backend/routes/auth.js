const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { register, login, getMe, logout, googleAuthCallback, forgotPassword, resetPassword , updateProfile} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// OAuth rate limiter - Best practice: stricter limits
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OAuth attempts per windowMs (reduced from 100)
  message: 'Too many OAuth attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

// Google OAuth routes - with rate limiting and state parameter for CSRF protection
router.get('/google', 
    oauthLimiter,
    (req, res, next) => {
        // Generate state parameter for CSRF protection
        const crypto = require('crypto');
        const state = crypto.randomBytes(32).toString('hex');
        
        // Store state in session (requires express-session)
        if (req.session) {
            req.session.oauthState = state;
        }
        
        next();
    },
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false,
        accessType: 'offline', // Request refresh token
        prompt: 'consent' // Force consent screen to ensure refresh token
    })
);

router.get('/google/callback', 
    oauthLimiter,
    passport.authenticate('google', { 
        failureRedirect: '/api/v1/auth/google/failure',
        session: false 
    }),
    googleAuthCallback
);

// Update profile
router.put('/update', protect, updateProfile);

// Failure route
router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        msg: 'Google authentication failed'
    });
});

// Forgot password & Reset password routes
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;