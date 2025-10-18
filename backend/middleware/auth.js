const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists - FIXED for MySQL
    const user = await executeQuery(
      'SELECT id, name, email, role, is_verified FROM users WHERE id = ?', 
      [decoded.userId]
    );
    
    if (!user || user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists'
      });
    }

    req.userId = decoded.userId;
    req.user = user[0]; // Get first user from results
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

module.exports = auth;