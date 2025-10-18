const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;

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

// Assignment Management
exports.createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { courseId } = req.params;
    const { title, description, due_date, max_points, assignment_type } = req.body;
    const teacherId = req.userId;

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to create assignments for this course', null, false);
    }

    const assignment = await Assignment.create({
      course_id: courseId,
      title,
      description,
      due_date,
      max_points,
      assignment_type
    });

    sendResponse(res, 201, 'Assignment created successfully', { assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    sendResponse(res, 500, 'Failed to create assignment', null, false);
  }
};

exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.findByCourseId(courseId);

    sendResponse(res, 200, 'Assignments retrieved successfully', { assignments });
  } catch (error) {
    console.error('Get course assignments error:', error);
    sendResponse(res, 500, 'Failed to retrieve assignments', null, false);
  }
};

// Submission Management
exports.submitAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { assignmentId } = req.params;
    const { submission_text } = req.body;
    const studentId = req.userId;

    let file_url = null;

    // Handle file upload
    if (req.files && req.files.file) {
      const fileResult = await cloudinary.uploader.upload(req.files.file.tempFilePath, {
        resource_type: 'raw',
        folder: 'lms/assignments'
      });
      file_url = fileResult.secure_url;
    }

    const submission = await Submission.create({
      assignment_id: assignmentId,
      student_id: studentId,
      submission_text,
      file_url
    });

    sendResponse(res, 201, 'Assignment submitted successfully', { submission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    if (error.message.includes('already submitted')) {
      return sendResponse(res, 409, error.message, null, false);
    }
    sendResponse(res, 500, 'Failed to submit assignment', null, false);
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.userId;

    // Verify teacher has access to this assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendResponse(res, 404, 'Assignment not found', null, false);
    }

    const ownsCourse = await Course.checkTeacherOwnership(assignment.course_id, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to view submissions for this assignment', null, false);
    }

    const submissions = await Submission.findByAssignmentId(assignmentId);
    sendResponse(res, 200, 'Submissions retrieved successfully', { submissions });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    sendResponse(res, 500, 'Failed to retrieve submissions', null, false);
  }
};

exports.getStudentSubmissions = async (req, res) => {
  try {
    const studentId = req.userId;
    const submissions = await Submission.findByStudentId(studentId);

    sendResponse(res, 200, 'Student submissions retrieved successfully', { submissions });
  } catch (error) {
    console.error('Get student submissions error:', error);
    sendResponse(res, 500, 'Failed to retrieve submissions', null, false);
  }
};

// Grading System
exports.gradeSubmission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.userId;

    // Verify teacher has permission to grade
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return sendResponse(res, 404, 'Submission not found', null, false);
    }

    const assignment = await Assignment.findById(submission.assignment_id);
    const ownsCourse = await Course.checkTeacherOwnership(assignment.course_id, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to grade this submission', null, false);
    }

    // Check if grade is within max points
    if (grade > assignment.max_points) {
      return sendResponse(res, 400, `Grade cannot exceed maximum points (${assignment.max_points})`, null, false);
    }

    await Submission.gradeSubmission(submissionId, {
      grade,
      feedback,
      graded_by: teacherId
    });

    sendResponse(res, 200, 'Submission graded successfully');
  } catch (error) {
    console.error('Grade submission error:', error);
    sendResponse(res, 500, 'Failed to grade submission', null, false);
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const studentId = req.userId;
    const gradeStats = await Submission.getStudentGradeStats(studentId);

    sendResponse(res, 200, 'Student grades retrieved successfully', { grades: gradeStats });
  } catch (error) {
    console.error('Get student grades error:', error);
    sendResponse(res, 500, 'Failed to retrieve grades', null, false);
  }
};