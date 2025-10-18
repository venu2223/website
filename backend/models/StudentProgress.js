const { executeQuery } = require('../config/database');

class StudentProgress {
  static async updateProgress(progressData) {
    try {
      const { student_id, course_id, content_id, progress_percentage, last_position, total_time_watched } = progressData;
      
      // Check if progress record exists
      const existing = await executeQuery(
        'SELECT id FROM student_progress WHERE student_id = ? AND content_id = ?',
        [student_id, content_id]
      );

      const is_completed = progress_percentage >= 95; // Mark as completed if 95% or more

      if (existing.length > 0) {
        // Update existing progress
        const result = await executeQuery(
          `UPDATE student_progress 
           SET progress_percentage = ?, last_position = ?, total_time_watched = ?,
               is_completed = ?, last_accessed = NOW(), completed_at = ?
           WHERE student_id = ? AND content_id = ?`,
          [
            progress_percentage, 
            last_position, 
            total_time_watched,
            is_completed,
            is_completed && !existing[0].is_completed ? new Date() : existing[0].completed_at,
            student_id, 
            content_id
          ]
        );
        return result.affectedRows > 0;
      } else {
        // Create new progress record
        const result = await executeQuery(
          `INSERT INTO student_progress 
           (student_id, course_id, content_id, progress_percentage, last_position, total_time_watched, is_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            student_id, 
            course_id, 
            content_id, 
            progress_percentage, 
            last_position, 
            total_time_watched,
            is_completed,
            is_completed ? new Date() : null
          ]
        );
        return result.insertId;
      }
    } catch (error) {
      console.error('Update progress error:', error);
      throw error;
    }
  }

  static async getProgress(studentId, courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          sp.*,
          cc.title as content_title,
          cc.content_type,
          cc.video_url,
          cc.duration as content_duration
        FROM student_progress sp
        JOIN course_content cc ON sp.content_id = cc.id
        WHERE sp.student_id = ? AND sp.course_id = ?
        ORDER BY cc.display_order ASC
      `, [studentId, courseId]);
      return rows;
    } catch (error) {
      console.error('Get progress error:', error);
      throw error;
    }
  }

  static async getCourseProgress(studentId, courseId) {
    try {
      // Get overall course progress
      const progressRows = await executeQuery(`
        SELECT 
          COUNT(*) as total_content,
          SUM(CASE WHEN sp.is_completed = TRUE THEN 1 ELSE 0 END) as completed_content,
          AVG(sp.progress_percentage) as average_progress
        FROM course_content cc
        LEFT JOIN student_progress sp ON cc.id = sp.content_id AND sp.student_id = ?
        WHERE cc.course_id = ? AND cc.is_published = TRUE
      `, [studentId, courseId]);

      const progress = progressRows[0];
      const overallProgress = progress.total_content > 0 
        ? Math.round((progress.completed_content / progress.total_content) * 100)
        : 0;

      return {
        total_content: progress.total_content,
        completed_content: progress.completed_content,
        average_progress: Math.round(progress.average_progress || 0),
        overall_progress: overallProgress
      };
    } catch (error) {
      console.error('Get course progress error:', error);
      throw error;
    }
  }

  static async getStudentOverallProgress(studentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.id as course_id,
          c.title as course_title,
          COUNT(cc.id) as total_content,
          COUNT(CASE WHEN sp.is_completed = TRUE THEN 1 END) as completed_content,
          ROUND((COUNT(CASE WHEN sp.is_completed = TRUE THEN 1 END) / COUNT(cc.id)) * 100) as progress_percentage
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN course_content cc ON c.id = cc.course_id AND cc.is_published = TRUE
        LEFT JOIN student_progress sp ON cc.id = sp.content_id AND sp.student_id = ?
        WHERE e.student_id = ?
        GROUP BY c.id, c.title
      `, [studentId, studentId]);

      return rows;
    } catch (error) {
      console.error('Get student overall progress error:', error);
      throw error;
    }
  }
}

module.exports = StudentProgress;