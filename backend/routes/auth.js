const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { register, login, getMe, logout, googleAuthCallback, forgotPassword, resetPassword } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// OAuth rate limiter
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OAuth attempts per windowMs
  message: 'Too many OAuth attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

// Google OAuth routes - with rate limiting
router.get('/google', 
    oauthLimiter,
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
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