const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ========== DEBUG MIDDLEWARE ==========
router.use((req, res, next) => {
  console.log(`🟡 Auth Route Called: ${req.method} ${req.originalUrl}`);
  next();
});

// ========== AUTH ROUTES ==========
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.getProfile);
router.post('/verify-email', authController.verifyEmail);
router.get('/health', authController.health);

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
  console.log('✅ GET /api/auth/test - Working!');
  res.json({
    success: true,
    message: '🎉 Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Auth routes loaded with actual controllers');

module.exports = router;