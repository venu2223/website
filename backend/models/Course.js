const { executeQuery } = require('../config/database');

class Course {
  static async create(courseData) {
    try {
      const { title, description, duration, teacher_id } = courseData;
      
      // Validate required fields
      if (!title || !description || !teacher_id) {
        throw new Error('Title, description, and teacher ID are required');
      }

      const result = await executeQuery(
        `INSERT INTO courses (title, description, duration, teacher_id, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [title.trim(), description.trim(), duration || null, teacher_id]
      );

      return { 
        id: result.insertId, 
        title: title.trim(), 
        description: description.trim(), 
        duration,
        teacher_id,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Course creation error:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.*,
          u.name as teacher_name,
          u.email as teacher_email,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.is_published = TRUE
        ORDER BY c.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Find all courses error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.*,
          u.name as teacher_name,
          u.email as teacher_email
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Find course by ID error:', error);
      throw error;
    }
  }

  static async findByTeacherId(teacherId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
        FROM courses c
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `, [teacherId]);
      return rows;
    } catch (error) {
      console.error('Find courses by teacher error:', error);
      throw error;
    }
  }

  static async update(courseId, teacherId, updateData) {
    try {
      const { title, description, duration, is_published } = updateData;
      
      const result = await executeQuery(
        `UPDATE courses 
         SET title = ?, description = ?, duration = ?, is_published = ?, updated_at = NOW()
         WHERE id = ? AND teacher_id = ?`,
        [title, description, duration, is_published, courseId, teacherId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Course update error:', error);
      throw error;
    }
  }

  // FIXED: Remove teacherId parameter to match controller call
  static async delete(courseId) {
    try {
      const result = await executeQuery(
        'DELETE FROM courses WHERE id = ?',
        [courseId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Course deletion error:', error);
      throw error;
    }
  }

  static async checkTeacherOwnership(courseId, teacherId) {
    try {
      const rows = await executeQuery(
        'SELECT id FROM courses WHERE id = ? AND teacher_id = ?',
        [courseId, teacherId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Check course ownership error:', error);
      throw error;
    }
  }
}

module.exports = Course;