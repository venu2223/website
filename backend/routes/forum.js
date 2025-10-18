const express = require('express');
const { body, param } = require('express-validator');
const forumController = require('../controllers/forumController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters long'),
  
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('post_type')
    .optional()
    .isIn(['discussion', 'question', 'announcement'])
    .withMessage('Post type must be discussion, question, or announcement')
];

const replyValidation = [
  body('content')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Content must be at least 5 characters long')
];

// Forum routes
router.post('/courses/:courseId/posts', 
  auth, 
  postValidation, 
  forumController.createPost
);

router.post('/posts/:postId/replies', 
  auth, 
  replyValidation, 
  forumController.createReply
);

router.get('/courses/:courseId/posts', 
  auth, 
  forumController.getCoursePosts
);

router.get('/posts/:postId', 
  auth, 
  forumController.getPost
);

module.exports = router;