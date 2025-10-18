const Forum = require('../models/Forum');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');

const sendResponse = (res, statusCode, message, data = null, success = true) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  res.status(statusCode).json(response);
};

exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { courseId } = req.params;
    const { title, content, post_type } = req.body;
    const userId = req.userId;

    // Verify user is enrolled in the course (or is teacher)
    const isEnrolled = await Enrollment.isEnrolled(userId, courseId);
    const isTeacher = req.user.role === 'teacher';
    
    if (!isEnrolled && !isTeacher) {
      return sendResponse(res, 403, 'You must be enrolled in this course to participate in discussions', null, false);
    }

    const post = await Forum.createPost({
      course_id: courseId,
      user_id: userId,
      title,
      content,
      post_type
    });

    // Notify course teacher about new post (if posted by student)
    if (!isTeacher) {
      const course = await executeQuery('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
      if (course.length > 0) {
        await Notification.create({
          user_id: course[0].teacher_id,
          title: 'New Forum Post',
          message: `A student posted in your course: "${title}"`,
          type: 'info',
          related_entity: 'forum',
          related_entity_id: post.id
        });
      }
    }

    sendResponse(res, 201, 'Post created successfully', { post });
  } catch (error) {
    console.error('Create post error:', error);
    sendResponse(res, 500, 'Failed to create post', null, false);
  }
};

exports.createReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const reply = await Forum.createReply({
      post_id: postId,
      user_id: userId,
      content
    });

    sendResponse(res, 201, 'Reply posted successfully', { reply });
  } catch (error) {
    console.error('Create reply error:', error);
    sendResponse(res, 500, 'Failed to post reply', null, false);
  }
};

exports.getCoursePosts = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const posts = await Forum.getCoursePosts(courseId, parseInt(page), parseInt(limit));

    sendResponse(res, 200, 'Posts retrieved successfully', { 
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get course posts error:', error);
    sendResponse(res, 500, 'Failed to retrieve posts', null, false);
  }
};

exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Forum.getPostWithReplies(postId);
    if (!post) {
      return sendResponse(res, 404, 'Post not found', null, false);
    }

    sendResponse(res, 200, 'Post retrieved successfully', { post });
  } catch (error) {
    console.error('Get post error:', error);
    sendResponse(res, 500, 'Failed to retrieve post', null, false);
  }
};