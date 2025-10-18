const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE SETUP ==========
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== BASIC ROUTES (TEST FIRST) ==========
app.get('/', (req, res) => {
  res.json({
    message: '🚀 LearnHub LMS API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      courses: '/api/courses/*',
      assignments: '/api/assignments/*',
      forum: '/api/forum/*',
      notifications: '/api/notifications/*'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ Server is healthy and running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ========== DATABASE INITIALIZATION ==========
const initializeDatabase = async () => {
  try {
    const { initDatabase } = require('./config/database');
    await initDatabase();
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// ========== ROUTE IMPORTS WITH ERROR HANDLING ==========
const loadRoutes = () => {
  try {
    console.log('🔄 Loading routes...');
    
    // Import routes
    const authRoutes = require('./routes/auth');
    const courseRoutes = require('./routes/courses');
    const assignmentRoutes = require('./routes/assignments');
    const forumRoutes = require('./routes/forum');
    const notificationRoutes = require('./routes/notifications');
    
    // Use the routes with proper base paths
    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/forum', forumRoutes);
    app.use('/api/notifications', notificationRoutes);
    
    console.log('✅ Main routes loaded successfully');
    
    // Log all available routes
    console.log('\n📚 Available API Endpoints:');
    console.log('   🔐 AUTH');
    console.log('     POST /api/auth/register');
    console.log('     POST /api/auth/login');
    console.log('     GET  /api/auth/me');
    console.log('     GET  /api/auth/test');
    
    console.log('   📚 COURSES');
    console.log('     GET  /api/courses');
    console.log('     POST /api/courses');
    console.log('     GET  /api/courses/:courseId');
    console.log('     GET  /api/courses/teacher/my-courses');
    console.log('     GET  /api/courses/student/my-courses');
    console.log('     POST /api/courses/:courseId/enroll');
    
    return true;
  } catch (error) {
    console.error('❌ Error loading main routes:', error.message);
    console.error(error.stack);
    return false;
  }
};

const loadVideoRoutes = () => {
  try {
    const videoRoutes = require('./routes/videos');
    app.use('/api/videos', videoRoutes);
    console.log('✅ Video routes loaded successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Video routes not loaded:', error.message);
    console.log('💡 This is okay for now - video features will be disabled');
    return false;
  }
};

// ========== BASIC TEST ROUTE ==========
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working!',
    timestamp: new Date().toISOString()
  });
});

// ========== SERVER STARTUP ==========
const startServer = async () => {
  console.log('🚀 Starting LearnHub LMS Server...');
  console.log('📁 Current directory:', __dirname);
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('🗄️  Database:', process.env.DB_NAME || 'lms_db');
  
  // Initialize database
  const dbReady = await initializeDatabase();
  if (!dbReady) {
    console.log('⚠️ Starting server without database connection');
  }
  
  // Load routes
  const routesReady = loadRoutes();
  const videoRoutesReady = loadVideoRoutes();
  
  if (!routesReady) {
    console.log('⚠️ Some routes failed to load, but server will continue');
  }

  // ========== 404 HANDLER (MUST BE AFTER ALL ROUTES) ==========
  app.use('*', (req, res) => {
    console.log('🔴 404 - Endpoint not found:', req.originalUrl);
    
    // Add CORS headers for 404 responses
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(404).json({
      success: false,
      message: '❌ Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        'GET  /',
        'GET  /api/health',
        'GET  /api/test',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET  /api/auth/me',
        'GET  /api/auth/test',
        'GET  /api/courses',
        'POST /api/courses',
        'GET  /api/courses/:id'
      ],
      timestamp: new Date().toISOString()
    });
  });

  // ========== ERROR HANDLER (MUST BE LAST) ==========
  app.use((err, req, res, next) => {
    console.error('🚨 Server Error:', err.stack);
    
    // Add CORS headers for error responses
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  });
  
  // Start server
  app.listen(PORT, () => {
    console.log('\n✨ ========== SERVER STARTED SUCCESSFULLY ========== ✨');
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`✅ Test Route: http://localhost:${PORT}/api/test`);
    console.log(`🔐 Auth Test: http://localhost:${PORT}/api/auth/test`);
    console.log('\n🔧 Server is ready to handle requests!');
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});

module.exports = app;