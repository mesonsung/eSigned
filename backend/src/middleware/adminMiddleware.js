const User = require('../models/User');

/**
 * Middleware to check if the authenticated user is an admin
 * Admin users are identified by username 'ADMIN'
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated (req.user should be set by authMiddleware)
    if (!req.user?.id) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    // Find the user in database to check their username
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    // Check if user is admin (username === 'ADMIN')
    if (user.username !== 'ADMIN') {
      return res.status(403).json({ 
        msg: 'Admin access required. Only ADMIN users can perform this action.',
        errorType: 'admin_required'
      });
    }

    // Add user info to request for potential use in controllers
    req.user.username = user.username;
    req.user.email = user.email;
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ msg: 'Server error during admin verification' });
  }
};

module.exports = adminMiddleware;
