const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// FIXED: Proper response format that frontend can parse
const sendResponse = (res, statusCode, message, data = null, success = true) => {
  const response = {
    success,
    message: typeof message === 'string' ? message : '',
    timestamp: new Date().toISOString()
  };
  
  // If message is an object, add it as errorData
  if (typeof message === 'object') {
    response.errorData = message;
    // Also set the main message from the object if available
    if (message.message) {
      response.message = message.message;
    }
  }
  
  if (data) {
    response.data = data;
  }
  
  res.status(statusCode).json(response);
};

exports.register = async (req, res) => {
  try {
    console.log('Registration attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, {
        type: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: errors.array()
      }, null, false);
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('Duplicate email found:', email, 'registered as:', existingUser.role);
      return sendResponse(res, 409, {
        type: 'USER_EXISTS',
        message: `This email is already registered as a ${existingUser.role}.`,
        existingRole: existingUser.role,
        requestedRole: role,
        suggestion: `Please try logging in as a ${existingUser.role} or use a different email address.`
      }, null, false);
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user.id);

    console.log('User registered successfully:', user.email);
    
    sendResponse(res, 201, 'User registered successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return sendResponse(res, 409, {
        type: 'USER_EXISTS',
        message: 'This email is already registered.',
        suggestion: 'Please try logging in or use a different email address.'
      }, null, false);
    }
    
    sendResponse(res, 500, {
      type: 'SERVER_ERROR',
      message: 'Registration failed due to server error',
      suggestion: 'Please try again in a few moments.'
    }, null, false);
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email, 'as', req.body.role);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return sendResponse(res, 400, {
        type: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: errors.array()
      }, null, false);
    }

    const { email, password, role } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      console.log('No account found with email:', email);
      return sendResponse(res, 404, {
        type: 'NO_ACCOUNT',
        message: 'No account found with this email address.',
        suggestion: 'Please check your email or create a new account.'
      }, null, false);
    }

    console.log('User found:', user.email, 'with role:', user.role);

    if (user.role !== role) {
      console.log('Role mismatch: requested', role, 'but user is', user.role);
      return sendResponse(res, 401, {
        type: 'ROLE_MISMATCH',
        message: `This email is registered as a ${user.role}, not a ${role}.`,
        actualRole: user.role,
        requestedRole: role,
        suggestion: `Please log in using the ${user.role} option.`
      }, null, false);
    }

    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return sendResponse(res, 401, {
        type: 'INVALID_PASSWORD',
        message: 'Incorrect password.',
        suggestion: 'Please check your password and try again.'
      }, null, false);
    }

    const token = generateToken(user.id);
    console.log('Login successful for user:', user.email, 'as', user.role);

    sendResponse(res, 200, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
      token
    });
    
  } catch (error) {
    console.error('Login error details:', error);
    sendResponse(res, 500, {
      type: 'SERVER_ERROR',
      message: 'Login failed due to server error',
      suggestion: 'Please try again in a few moments.'
    }, null, false);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return sendResponse(res, 404, {
        type: 'USER_NOT_FOUND',
        message: 'User not found'
      }, null, false);
    }

    sendResponse(res, 200, 'Profile retrieved successfully', { user });
    
  } catch (error) {
    console.error('Get profile error:', error);
    sendResponse(res, 500, {
      type: 'SERVER_ERROR',
      message: 'Failed to retrieve profile'
    }, null, false);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { userId } = req;
    await User.updateVerification(userId);
    sendResponse(res, 200, 'Email verified successfully');
  } catch (error) {
    console.error('Email verification error:', error);
    sendResponse(res, 500, {
      type: 'SERVER_ERROR',
      message: 'Email verification failed'
    }, null, false);
  }
};

exports.health = async (req, res) => {
  try {
    const testResult = await User.testConnection();
    if (!testResult) {
      return sendResponse(res, 500, {
        type: 'DATABASE_ERROR',
        message: 'Database connection failed'
      }, null, false);
    }
    
    sendResponse(res, 200, 'Server and database are healthy', {
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    sendResponse(res, 500, {
      type: 'SERVER_ERROR',
      message: 'Health check failed'
    }, null, false);
  }
};