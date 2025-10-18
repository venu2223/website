const { executeQuery } = require('../config/database');

class Submission {
  static async create(submissionData) {
    try {
      const { assignment_id, student_id, submission_text, file_url } = submissionData;
      
      if (!assignment_id || !student_id) {
        throw new Error('Assignment ID and student ID are required');
      }

      // Check if already submitted
      const existing = await executeQuery(
        'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
        [assignment_id, student_id]
      );

      if (existing.length > 0) {
        throw new Error('You have already submitted this assignment');
      }

      const result = await executeQuery(
        `INSERT INTO submissions 
         (assignment_id, student_id, submission_text, file_url, submitted_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [assignment_id, student_id, submission_text, file_url]
      );

      return { 
        id: result.insertId,
        assignment_id,
        student_id,
        submission_text,
        file_url,
        submitted_at: new Date(),
        grade: null,
        feedback: null
      };
    } catch (error) {
      console.error('Submission creation error:', error);
      throw error;
    }
  }

  static async findByAssignmentId(assignmentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          s.*,
          u.name as student_name,
          u.email as student_email
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ?
        ORDER BY s.submitted_at DESC
      `, [assignmentId]);
      return rows;
    } catch (error) {
      console.error('Find submissions by assignment error:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          s.*,
          a.title as assignment_title,
          a.max_points,
          a.due_date,
          c.title as course_title,
          u.name as teacher_name
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN courses c ON a.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE s.student_id = ?
        ORDER BY s.submitted_at DESC
      `, [studentId]);
      return rows;
    } catch (error) {
      console.error('Find submissions by student error:', error);
      throw error;
    }
  }

  static async gradeSubmission(submissionId, gradeData) {
    try {
      const { grade, feedback, graded_by } = gradeData;
      
      if (grade < 0) {
        throw new Error('Grade cannot be negative');
      }

      const result = await executeQuery(
        `UPDATE submissions 
         SET grade = ?, feedback = ?, graded_at = NOW(), graded_by = ?
         WHERE id = ?`,
        [grade, feedback, graded_by, submissionId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Grade submission error:', error);
      throw error;
    }
  }

  static async getStudentGradeStats(studentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(s.id) as submitted_assignments,
          COUNT(CASE WHEN s.grade IS NOT NULL THEN 1 END) as graded_assignments,
          AVG(s.grade) as average_grade,
          SUM(a.max_points) as total_possible_points,
          SUM(s.grade) as total_earned_points
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
        WHERE a.course_id IN (
          SELECT course_id FROM enrollments WHERE student_id = ?
        )
      `, [studentId, studentId]);

      const stats = rows[0];
      const overall_percentage = stats.total_possible_points > 0 
        ? (stats.total_earned_points / stats.total_possible_points) * 100 
        : 0;

      return {
        ...stats,
        overall_percentage: Math.round(overall_percentage),
        average_grade: Math.round(stats.average_grade || 0)
      };
    } catch (error) {
      console.error('Get student grade stats error:', error);
      throw error;
    }
  }
}

module.exports = Submission;