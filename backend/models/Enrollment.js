const { executeQuery } = require('../config/database');

class Enrollment {
  static async enroll(studentId, courseId) {
    try {
      // Check if already enrolled
      const existing = await executeQuery(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [studentId, courseId]
      );

      if (existing.length > 0) {
        throw new Error('Student is already enrolled in this course');
      }

      const result = await executeQuery(
        'INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES (?, ?, NOW())',
        [studentId, courseId]
      );

      return { 
        id: result.insertId, 
        student_id: studentId, 
        course_id: courseId,
        enrolled_at: new Date()
      };
    } catch (error) {
      console.error('Enrollment error:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          e.*,
          c.title as course_title,
          c.description as course_description,
          c.duration as course_duration,
          u.name as teacher_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC
      `, [studentId]);
      return rows;
    } catch (error) {
      console.error('Find enrollments by student error:', error);
      throw error;
    }
  }

  static async findByCourseId(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          e.*,
          u.name as student_name,
          u.email as student_email
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.course_id = ?
        ORDER BY e.enrolled_at DESC
      `, [courseId]);
      return rows;
    } catch (error) {
      console.error('Find enrollments by course error:', error);
      throw error;
    }
  }

  static async isEnrolled(studentId, courseId) {
    try {
      const rows = await executeQuery(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [studentId, courseId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Check enrollment error:', error);
      throw error;
    }
  }

  static async getEnrollmentCount(courseId) {
    try {
      const rows = await executeQuery(
        'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
        [courseId]
      );
      return rows[0].count;
    } catch (error) {
      console.error('Get enrollment count error:', error);
      throw error;
    }
  }
}

module.exports = Enrollment;