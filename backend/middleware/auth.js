const jwt = require('jsonwebtoken');
const User = require('../models/User');

//Protect routes
exports.protect = async (req, res, next) => {
    let token;

    // Check Authorization header first (for API requests with Bearer token)
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // If no Authorization header, check cookie (for OAuth and same-origin requests)
    else if(req.cookies.token) {
        token = req.cookies.token;
    }

    //Make sure token exists
    if(!token || token === 'null') {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        //Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.user = await User.findById(decoded.id);
        next();
    } catch(err) {
        console.log(err.stack);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    }
};