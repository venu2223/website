const Course = require('../models/Course');
const CourseContent = require('../models/CourseContent');
const Enrollment = require('../models/Enrollment');
const StudentProgress = require('../models/StudentProgress');
const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Import Cloudinary configuration
const { cloudinary } = require('../config/cloudinary');

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

// Course Management
exports.createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { title, description, duration } = req.body;
    const teacher_id = req.userId;

    console.log('Creating course with data:', { title, description, duration, teacher_id });

    // Additional validation
    if (!title || !title.trim()) {
      return sendResponse(res, 400, 'Course title is required', null, false);
    }

    if (!description || !description.trim()) {
      return sendResponse(res, 400, 'Course description is required', null, false);
    }

    if (!teacher_id) {
      return sendResponse(res, 400, 'Teacher ID is required', null, false);
    }

    const course = await Course.create({
      title,
      description,
      duration,
      teacher_id
    });

    console.log('✅ Course created successfully:', course.id);
    sendResponse(res, 201, 'Course created successfully', { course });
  } catch (error) {
    console.error('❌ Create course error:', error);
    
    // More specific error messages
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return sendResponse(res, 400, 'Invalid teacher ID - user not found', null, false);
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return sendResponse(res, 400, 'Course with this title already exists', null, false);
    }
    
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return sendResponse(res, 400, 'Missing required fields', null, false);
    }
    
    sendResponse(res, 500, 'Failed to create course: ' + error.message, null, false);
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    sendResponse(res, 200, 'Courses retrieved successfully', { courses });
  } catch (error) {
    console.error('Get all courses error:', error);
    sendResponse(res, 500, 'Failed to retrieve courses', null, false);
  }
};

exports.getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.userId;
    const courses = await Course.findByTeacherId(teacherId);
    sendResponse(res, 200, 'Teacher courses retrieved successfully', { courses });
  } catch (error) {
    console.error('Get teacher courses error:', error);
    sendResponse(res, 500, 'Failed to retrieve teacher courses', null, false);
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return sendResponse(res, 404, 'Course not found', null, false);
    }

    // Get course content
    let content = [];
    try {
      content = await CourseContent.findByCourseId(courseId);
    } catch (contentError) {
      console.warn('Could not fetch course content:', contentError.message);
      content = [];
    }

    // Check if user is enrolled (for students)
    let isEnrolled = false;
    if (req.user && req.user.role === 'student') {
      try {
        isEnrolled = await Enrollment.isEnrolled(req.userId, courseId);
      } catch (enrollError) {
        console.warn('Could not check enrollment status:', enrollError.message);
      }
    }

    sendResponse(res, 200, 'Course details retrieved successfully', {
      course,
      content,
      isEnrolled
    });
  } catch (error) {
    console.error('Get course details error:', error);
    sendResponse(res, 500, 'Failed to retrieve course details', null, false);
  }
};

// Get course assignments
exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.userId;

    // Verify teacher owns the course or student is enrolled
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacherId);
    const isEnrolled = await Enrollment.isEnrolled(teacherId, courseId);
    
    if (!ownsCourse && !isEnrolled) {
      return sendResponse(res, 403, 'You do not have permission to view assignments for this course', null, false);
    }

    // Mock assignments data for now
    const assignments = [
      {
        id: 1,
        title: "Introduction Assignment",
        description: "Complete the introductory assignment",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_points: 100,
        assignment_type: "assignment"
      }
    ];

    sendResponse(res, 200, 'Course assignments retrieved successfully', { assignments });
  } catch (error) {
    console.error('Get course assignments error:', error);
    sendResponse(res, 500, 'Failed to retrieve course assignments', null, false);
  }
};

// Course Content Management
exports.addCourseContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { courseId } = req.params;
    const { title, description, content_type, duration, order_index } = req.body;
    const teacher_id = req.userId;

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacher_id);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to add content to this course', null, false);
    }

    let video_url = null;
    let video_public_id = null;
    let video_duration = 0;
    let document_url = null;

    // Handle file uploads - LOCAL STORAGE (for non-video content)
    if (req.files) {
      if (req.files.video && req.files.video[0] && content_type === 'video') {
        const videoFile = req.files.video[0];
        video_url = `/api/uploads/videos/${videoFile.filename}`;
        
        // Note: For Cloudinary video uploads, use the dedicated video upload endpoint
        console.log('Local video upload - consider using Cloudinary for better performance');
      }

      if (req.files.document && req.files.document[0] && content_type === 'document') {
        const documentFile = req.files.document[0];
        document_url = `/api/uploads/documents/${documentFile.filename}`;
      }
    }

    const content = await CourseContent.create({
      course_id: courseId,
      title: title.trim(),
      description: description?.trim(),
      content_type,
      video_url,
      video_public_id,
      video_duration,
      document_url,
      duration: duration || 0,
      order_index: order_index || 0
    });

    sendResponse(res, 201, 'Course content added successfully', { content });
  } catch (error) {
    console.error('Add course content error:', error);
    sendResponse(res, 500, 'Failed to add course content', null, false);
  }
};

// NEW: Add video content via Cloudinary
exports.addVideoContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { courseId } = req.params;
    const { 
      title, 
      description, 
      video_url, 
      video_public_id, 
      video_duration, 
      order_index 
    } = req.body;
    
    const teacher_id = req.userId;

    console.log('Adding video content:', {
      courseId,
      title,
      hasVideoUrl: !!video_url,
      hasPublicId: !!video_public_id,
      video_duration
    });

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacher_id);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to add content to this course', null, false);
    }

    // Validate required video fields
    if (!video_url || !video_public_id) {
      return sendResponse(res, 400, 'Video URL and public ID are required for video content', null, false);
    }

    const content = await CourseContent.create({
      course_id: courseId,
      title: title.trim(),
      description: description?.trim(),
      content_type: 'video',
      video_url,
      video_public_id,
      video_duration: video_duration || 0,
      document_url: null,
      duration: 0,
      order_index: order_index || 0
    });

    console.log('Video content created successfully:', content.id);

    sendResponse(res, 201, 'Video content added successfully', { content });
  } catch (error) {
    console.error('Add video content error:', error);
    sendResponse(res, 500, 'Failed to add video content', null, false);
  }
};

// NEW: Get course videos specifically
exports.getCourseVideos = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // Check if user has access to the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, userId);
    const isEnrolled = await Enrollment.isEnrolled(userId, courseId);
    
    if (!ownsCourse && !isEnrolled) {
      return sendResponse(res, 403, 'You do not have permission to view videos for this course', null, false);
    }

    const videos = await CourseContent.findVideosByCourseId(courseId);

    sendResponse(res, 200, 'Course videos retrieved successfully', { videos });
  } catch (error) {
    console.error('Get course videos error:', error);
    sendResponse(res, 500, 'Failed to retrieve course videos', null, false);
  }
};

// NEW: Delete course content with Cloudinary cleanup
exports.deleteCourseContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const teacher_id = req.userId;

    console.log('Deleting content:', contentId, 'by teacher:', teacher_id);

    // Verify teacher owns the content
    const ownsContent = await CourseContent.checkContentOwnership(contentId, teacher_id);
    if (!ownsContent) {
      return sendResponse(res, 403, 'You do not have permission to delete this content', null, false);
    }

    // Get content details before deletion
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return sendResponse(res, 404, 'Content not found', null, false);
    }

    // Delete from database
    const deleteResult = await CourseContent.delete(contentId);

    if (!deleteResult.success) {
      return sendResponse(res, 500, 'Failed to delete content from database', null, false);
    }

    // If it's a video with Cloudinary public_id, delete from Cloudinary
    if (content.content_type === 'video' && content.video_public_id) {
      try {
        console.log('Deleting video from Cloudinary:', content.video_public_id);
        const cloudinaryResult = await cloudinary.uploader.destroy(content.video_public_id, {
          resource_type: 'video'
        });
        console.log('Cloudinary deletion result:', cloudinaryResult);
      } catch (cloudinaryError) {
        console.error('Failed to delete video from Cloudinary:', cloudinaryError);
        // Don't fail the request if Cloudinary deletion fails, just log it
      }
    }

    sendResponse(res, 200, 'Content deleted successfully');
  } catch (error) {
    console.error('Delete course content error:', error);
    sendResponse(res, 500, 'Failed to delete content', null, false);
  }
};

// NEW: Update video content
exports.updateVideoContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { title, description, order_index, is_published } = req.body;
    const teacher_id = req.userId;

    // Verify teacher owns the content
    const ownsContent = await CourseContent.checkContentOwnership(contentId, teacher_id);
    if (!ownsContent) {
      return sendResponse(res, 403, 'You do not have permission to update this content', null, false);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (is_published !== undefined) updateData.is_published = is_published;

    const updated = await CourseContent.update(contentId, updateData);

    if (!updated) {
      return sendResponse(res, 404, 'Content not found or no changes made', null, false);
    }

    sendResponse(res, 200, 'Video content updated successfully');
  } catch (error) {
    console.error('Update video content error:', error);
    sendResponse(res, 500, 'Failed to update video content', null, false);
  }
};

// NEW: Get content statistics
exports.getContentStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacher_id = req.userId;

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacher_id);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to view stats for this course', null, false);
    }

    const stats = await CourseContent.getContentStats(courseId);

    sendResponse(res, 200, 'Content statistics retrieved successfully', { stats });
  } catch (error) {
    console.error('Get content stats error:', error);
    sendResponse(res, 500, 'Failed to retrieve content statistics', null, false);
  }
};

// Enrollment
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return sendResponse(res, 404, 'Course not found', null, false);
    }

    // Enroll student
    const enrollment = await Enrollment.enroll(studentId, courseId);

    sendResponse(res, 201, 'Successfully enrolled in course', { enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    if (error.message.includes('already enrolled')) {
      return sendResponse(res, 409, error.message, null, false);
    }
    sendResponse(res, 500, 'Failed to enroll in course', null, false);
  }
};

exports.getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.userId;
    const enrollments = await Enrollment.findByStudentId(studentId);
    
    // Get progress for each enrolled course
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await StudentProgress.getCourseProgress(studentId, enrollment.course_id);
        return {
          ...enrollment,
          progress
        };
      })
    );

    sendResponse(res, 200, 'Enrollments retrieved successfully', { enrollments: enrollmentsWithProgress });
  } catch (error) {
    console.error('Get student enrollments error:', error);
    sendResponse(res, 500, 'Failed to retrieve enrollments', null, false);
  }
};

exports.getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.userId;

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to view enrollments for this course', null, false);
    }

    const enrollments = await Enrollment.findByCourseId(courseId);
    sendResponse(res, 200, 'Course enrollments retrieved successfully', { enrollments });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    sendResponse(res, 500, 'Failed to retrieve course enrollments', null, false);
  }
};

// Progress Tracking
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const { progress_percentage, last_position, total_time_watched } = req.body;
    const studentId = req.userId;

    // Verify student is enrolled in the course
    const isEnrolled = await Enrollment.isEnrolled(studentId, courseId);
    if (!isEnrolled) {
      return sendResponse(res, 403, 'You are not enrolled in this course', null, false);
    }

    await StudentProgress.updateProgress({
      student_id: studentId,
      course_id: courseId,
      content_id: contentId,
      progress_percentage,
      last_position,
      total_time_watched
    });

    // Get updated overall course progress
    const courseProgress = await StudentProgress.getCourseProgress(studentId, courseId);

    sendResponse(res, 200, 'Progress updated successfully', { courseProgress });
  } catch (error) {
    console.error('Update progress error:', error);
    sendResponse(res, 500, 'Failed to update progress', null, false);
  }
};

exports.getStudentProgress = async (req, res) => {
  try {
    const studentId = req.userId;
    const overallProgress = await StudentProgress.getStudentOverallProgress(studentId);

    sendResponse(res, 200, 'Student progress retrieved successfully', { progress: overallProgress });
  } catch (error) {
    console.error('Get student progress error:', error);
    sendResponse(res, 500, 'Failed to retrieve student progress', null, false);
  }
};

// NEW: Cloudinary upload signature for direct frontend uploads
exports.getCloudinarySignature = async (req, res) => {
  try {
    const { folder = 'lms/courses/videos' } = req.body;
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder
      },
      process.env.CLOUDINARY_API_SECRET
    );

    sendResponse(res, 200, 'Cloudinary signature generated', {
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    sendResponse(res, 500, 'Failed to generate upload signature', null, false);
  }
};
// NEW: Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacher_id = req.userId;

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacher_id);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to delete this course', null, false);
    }

    // First, get all video content to delete from Cloudinary
    const courseContent = await CourseContent.findByCourseId(courseId);
    const videoContent = courseContent.filter(item => item.content_type === 'video' && item.video_public_id);

    // Delete videos from Cloudinary
    for (const content of videoContent) {
      if (content.video_public_id) {
        try {
          await cloudinary.uploader.destroy(content.video_public_id, {
            resource_type: 'video'
          });
          console.log('Deleted video from Cloudinary:', content.video_public_id);
        } catch (cloudinaryError) {
          console.error('Failed to delete video from Cloudinary:', cloudinaryError);
        }
      }
    }

    // Delete course from database (this should cascade delete content, enrollments, etc.)
    const deleted = await Course.delete(courseId);

    if (!deleted) {
      return sendResponse(res, 404, 'Course not found', null, false);
    }

    sendResponse(res, 200, 'Course deleted successfully');
  } catch (error) {
    console.error('Delete course error:', error);
    sendResponse(res, 500, 'Failed to delete course', null, false);
  }
};