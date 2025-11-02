const User = require("../models/User");

//@desc   Register user
//@route  POST /api/v1/auth/register
//@access Public
exports.register = async (req, res, next) => {
  try {
    const { name, tel, email, password, role } = req.body;

    //Create user
    const user = await User.create({
      name,
      tel,
      email,
      password,
      role,
    });

    // //Create token
    // const token = user.getSignedJwtToken();

    // res.status(200).json({
    //     success: true,
    //     token
    // });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
    });
    console.log(err.stack);
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

  //Validate email & password
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, msg: "Please provide an email and password" });
  }

  //check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ success: false, msg: "Invalid credentials" });
  }

  //Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, msg: "Invalid credentials" });
  }
  // //create token
  // const token = user.getSignedJwtToken();
  // res.status(200).json({ success: true, token });
  sendTokenResponse(user, 200, res);
  }catch (err) {
    res.status(401).json({
      success: false,
      msg: "Cannot convert email or password to string",
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
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
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
  res.status(200).json({
    success: true,
    data: user,
  });
};

//@desc  Logout user
//@route GET /api/v1/auth/logout
//@access Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
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
    console.log('✅ Token generated');

    // Build user data and include tel/role so frontend can detect missing fields
    const userData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      tel: req.user.tel || null,
      role: req.user.role || 'user',
      token: token
    };

    const encoded = encodeURIComponent(JSON.stringify(userData));
    const redirectUrl = `${frontendUrl}/auth/google/callback?googleAuth=true&data=${encoded}`;
    
    console.log('🔄 Redirecting to:', redirectUrl.substring(0, 100) + '...');
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('❌ Error during Google callback:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/google/callback?error=server_error`);
  }
};
