const express = require('express');
const { body, param } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Validation rules
const assignmentValidation = [
  body('title')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters long'),
  
  body('max_points')
    .isInt({ min: 1 })
    .withMessage('Max points must be a positive number'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  
  body('assignment_type')
    .optional()
    .isIn(['assignment', 'quiz', 'exam'])
    .withMessage('Assignment type must be assignment, quiz, or exam')
];

const submissionValidation = [
  body('submission_text')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Submission text must be at least 10 characters long')
];

const gradingValidation = [
  body('grade')
    .isFloat({ min: 0 })
    .withMessage('Grade must be a positive number'),
  
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters')
];

// Assignment routes
router.post('/courses/:courseId/assignments', 
  auth, 
  assignmentValidation, 
  assignmentController.createAssignment
);

router.get('/courses/:courseId/assignments', 
  auth, 
  assignmentController.getCourseAssignments
);

// Submission routes
router.post('/assignments/:assignmentId/submit', 
  auth, 
  upload.single('file'),
  submissionValidation, 
  assignmentController.submitAssignment
);

router.get('/assignments/:assignmentId/submissions', 
  auth, 
  assignmentController.getAssignmentSubmissions
);

router.get('/student/submissions', 
  auth, 
  assignmentController.getStudentSubmissions
);

// Grading routes
router.post('/submissions/:submissionId/grade', 
  auth, 
  gradingValidation, 
  assignmentController.gradeSubmission
);

router.get('/student/grades', 
  auth, 
  assignmentController.getStudentGrades
);

module.exports = router;