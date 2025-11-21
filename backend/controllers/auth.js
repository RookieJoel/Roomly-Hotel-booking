const User = require("../models/User");
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// HTML Escape Helper to prevent XSS in emails
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
};

//@desc   Register user
//@route  POST /api/v1/auth/register
//@access Public
exports.register = async (req, res, next) => {
  try {
    const { name, tel, email, password, role } = req.body;

    console.log('📝 Registration attempt:', { name, email, tel });

    //Create user
    const user = await User.create({
      name,
      tel,
      email,
      password,
      role,
    });

    console.log('✅ Registration successful:', { 
      userId: user._id, 
      email: user.email, 
      name: user.name 
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('❌ Registration failed:');
    console.error('Email:', req.body.email);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    
    // Log specific validation errors
    if (err.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(err.errors).forEach(key => {
        console.error(`  - ${key}: ${err.errors[key].message}`);
      });
    }
    
    // Check for duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      console.error(`Duplicate ${field}:`, req.body[field]);
      return res.status(400).json({
        success: false,
        msg: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    console.error('Full error stack:', err.stack);
    
    res.status(400).json({
      success: false,
      msg: err.message || 'Registration failed'
    });
  }
};

// @desc   Update user profile (partial)
// @route  PUT /api/v1/auth/update
// @access Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: 'Not authorized' });
    }

    const { name, tel, role } = req.body;
    const updates = {};
    if (typeof name !== 'undefined') updates.name = name;
    if (typeof tel !== 'undefined') updates.tel = tel;
    if (typeof role !== 'undefined') updates.role = role;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, timestamp: new Date().toISOString() });

    //Validate email & password
    if (!email || !password) {
      console.warn('⚠️  Login failed: Missing credentials');
      return res
        .status(400)
        .json({ success: false, msg: "Please provide an email and password" });
    }

    //check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.warn('❌ Login failed: User not found -', email);
      return res.status(401).json({ success: false, msg: "Invalid credentials" });
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.warn('❌ Login failed: Incorrect password for', email);
      return res.status(401).json({ success: false, msg: "Invalid credentials" });
    }

    console.log('✅ Login successful:', { 
      userId: user._id, 
      email: user.email, 
      name: user.name 
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('❌ Login error:', {
      email: req.body.email,
      error: err.message,
      stack: err.stack
    });
    res.status(401).json({
      success: false,
      msg: "Login failed. Please try again.",
    });
  }
};

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //Create token
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'strict', // Prevent CSRF attacks
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true; // Only send cookie over HTTPS in production
  }
  res
    .status(statusCode) /*.cookie('token',token,options)*/
    .json({
      success: true,
      //add for frontend
      _id: user._id,
      name: user.name,
      email: user.email,
      //end for frontend
      token,
    });
};

exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Generate fresh token for OAuth callback flow
  const token = user.getSignedJwtToken();
  
  res.status(200).json({
    success: true,
    data: user,
    token: token // Include token for OAuth callback
  });
};

//@desc  Logout user
//@route GET /api/v1/auth/logout
//@access Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({
    success: true,
    data: {},
  });
};

//@desc  Google OAuth Success Handler
//@route GET /api/v1/auth/google/callback (handled by passport)
//@access Public
exports.googleAuthCallback = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    console.log('=== Google OAuth Callback ===');
    console.log('User:', req.user ? req.user.email : 'No user');
    console.log('Frontend URL:', frontendUrl);
    
    // req.user is set by passport after successful authentication
    if (!req.user) {
      console.log('❌ No user found');
      return res.redirect(`${frontendUrl}/auth/google/callback?error=authentication_failed`);
    }

    // Generate token for the user
    const token = req.user.getSignedJwtToken();
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    // Set token as HTTP-only cookie (security best practice)
    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // Allow cookie on OAuth redirect
      path: '/',
      domain: 'localhost' // Explicit domain for development
    };

    console.log('🍪 Setting cookie with options:', {
      ...options,
      expires: options.expires.toISOString(),
      nodeEnv: process.env.NODE_ENV
    });

    res.cookie('token', token, options);
    console.log('✅ Cookie set with name: token, httpOnly: true (secure)');

    // Pass user data WITHOUT token in URL
    const userData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      tel: req.user.tel || null,
      role: req.user.role || 'user'
    };

    const encoded = encodeURIComponent(JSON.stringify(userData));
    const redirectUrl = `${frontendUrl}/auth/google/callback?googleAuth=true&data=${encoded}`;
    
    console.log('🔄 Redirecting to:', redirectUrl.substring(0, 100) + '...');
    console.log('✅ Token sent via cookie ONLY (not in URL)');
    
    // Clear OAuth state from session
    if (req.session?.oauthState) {
      delete req.session.oauthState;
    }
    
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('❌ Error during Google callback:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/google/callback?error=server_error`);
  }
};

//@desc  Forgot password
//@route POST /api/v1/auth/forgotpassword
//@access Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'There is no user with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password for your Hotel Booking account.</p>
            <p>Please click the button below to reset your password. This link will expire in <strong>10 minutes</strong>.</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p><strong>If you did not request this password reset, please ignore this email.</strong></p>
            <p>For security reasons, this link will only work once and will expire after 10 minutes.</p>
          </div>
          <div class="footer">
            <p>© 2024 Hotel Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: escapeHtml(user.email), // Sanitize email to prevent XSS
        subject: 'Password Reset Request - Hotel Booking System',
        html
      });

      res.status(200).json({ 
        success: true, 
        msg: 'Email sent. Please check your inbox.',
        data: {} 
      });
    } catch (err) {
      console.log(err);
      user.resetpasswordToken = undefined;
      user.resetpasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        msg: 'Email could not be sent'
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
};

//@desc  Reset password
//@route PUT /api/v1/auth/resetpassword/:resettoken
//@access Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetpasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetpasswordToken,
      resetpasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid token or token has expired'
      });
    }

    // Validate password confirmation
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Passwords do not match'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetpasswordToken = undefined;
    user.resetpasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
};
