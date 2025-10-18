const express = require('express');
const { body, param } = require('express-validator');
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Validation rules
const courseValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
];

const contentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required'),
  
  body('content_type')
    .isIn(['video', 'document', 'quiz'])
    .withMessage('Content type must be video, document, or quiz')
];

// NEW: Video content validation
const videoContentValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  
  body('video_url')
    .notEmpty()
    .withMessage('Video URL is required')
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  
  body('video_public_id')
    .notEmpty()
    .withMessage('Video public ID is required'),
  
  body('video_duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Video duration must be a positive number'),
  
  body('order_index')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a positive number')
];

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:courseId', courseController.getCourseDetails);

// Protected routes
router.post('/', auth, courseValidation, courseController.createCourse);
router.get('/teacher/my-courses', auth, courseController.getTeacherCourses);

// Enrollment routes
router.post('/:courseId/enroll', auth, courseController.enrollInCourse);
router.get('/student/my-courses', auth, courseController.getStudentEnrollments);
router.get('/:courseId/enrollments', auth, courseController.getCourseEnrollments);

// Assignments route
router.get('/:courseId/assignments', auth, courseController.getCourseAssignments);

// Course content routes (teacher only)
router.post('/:courseId/content', 
  auth, 
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]), 
  contentValidation, 
  courseController.addCourseContent
);

// NEW: Video-specific content routes
router.post('/:courseId/content/video',
  auth,
  videoContentValidation,
  courseController.addVideoContent
);

// NEW: Get course videos
router.get('/:courseId/videos',
  auth,
  courseController.getCourseVideos
);

// NEW: Content management routes
router.delete('/:courseId/content/:contentId',
  auth,
  courseController.deleteCourseContent
);
router.put('/content/:contentId/video',
  auth,
  [
    body('title')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    
    body('order_index')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order index must be a positive number'),
    
    body('is_published')
      .optional()
      .isBoolean()
      .withMessage('Published status must be a boolean')
  ],
  courseController.updateVideoContent
);

// NEW: Content statistics route
router.get('/:courseId/content/stats',
  auth,
  courseController.getContentStats
);
// NEW: Delete course route
router.delete('/:courseId',
  auth,
  courseController.deleteCourse
);
// Progress tracking routes
router.post('/:courseId/content/:contentId/progress', auth, courseController.updateProgress);
router.get('/student/progress', auth, courseController.getStudentProgress);

// NEW: Cloudinary routes (Enabled for video uploads)
router.post('/upload/signature', auth, courseController.getCloudinarySignature);

module.exports = router;