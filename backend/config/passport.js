const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                passReqToCallback: true // Enable access to req in callback
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    // Validate that email exists and is verified
                    if (!profile.emails || profile.emails.length === 0) {
                        return done(new Error('No email associated with this Google account'), null);
                    }

                    const email = profile.emails[0].value;
                    const emailVerified = profile.emails[0].verified;

                    // Only accept verified emails
                    if (!emailVerified) {
                        return done(new Error('Email not verified by Google'), null);
                    }

                    // Verify state parameter to prevent CSRF
                    const state = req.query.state;
                    const sessionState = req.session?.oauthState;
                    
                    if (state && sessionState && state !== sessionState) {
                        return done(new Error('Invalid state parameter - possible CSRF attack'), null);
                    }

                    // Check if user already exists by googleId first (more secure)
                    let user = await User.findOne({ googleId: profile.id });

                    if (!user) {
                        // Check by email as fallback
                        user = await User.findOne({ email: email });
                    }

                    if (user) {
                        // User exists - update googleId if not set
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            await user.save({ validateBeforeSave: false });
                        }
                        return done(null, user);
                    } else {
                        // Create new user with secure random password
                        const securePassword = crypto.randomBytes(32).toString('hex');
                        
                        const newUser = {
                            name: profile.displayName || profile.name?.givenName || 'Google User',
                            email: email,
                            tel: '0000000000', // Default phone number for Google OAuth users
                            password: securePassword, // Cryptographically secure random password
                            googleId: profile.id,
                            role: 'user'
                        };

                        user = await User.create(newUser);
                        return done(null, user);
                    }
                } catch (err) {
                    console.error('❌ Google OAuth Strategy Error:', err.message);
                    return done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
