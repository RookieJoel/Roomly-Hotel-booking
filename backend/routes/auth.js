const express = require('express');
const passport = require('passport');
const { register, login, getMe, logout, googleAuthCallback} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

// Google OAuth routes
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

// Failure route
router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        msg: 'Google authentication failed'
    });
});

module.exports = router;