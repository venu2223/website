const { executeQuery } = require('../config/database');

class Notification {
  static async create(notificationData) {
    try {
      const { user_id, title, message, type, related_entity, related_entity_id } = notificationData;
      
      if (!user_id || !title || !message) {
        throw new Error('User ID, title, and message are required');
      }

      const result = await executeQuery(
        `INSERT INTO notifications 
         (user_id, title, message, type, related_entity, related_entity_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [user_id, title.trim(), message.trim(), type || 'info', related_entity, related_entity_id]
      );

      return { 
        id: result.insertId,
        user_id,
        title: title.trim(),
        message: message.trim(),
        type: type || 'info',
        related_entity,
        related_entity_id,
        is_read: false,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Notification creation error:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, limit = 20) {
    try {
      const rows = await executeQuery(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [userId, limit]);

      return rows;
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const result = await executeQuery(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await executeQuery(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const rows = await executeQuery(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return rows[0].count;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  // Create notifications for course events
  static async notifyCourseStudents(courseId, title, message, type = 'info') {
    try {
      // Get all enrolled students
      const students = await executeQuery(`
        SELECT u.id FROM users u
        JOIN enrollments e ON u.id = e.student_id
        WHERE e.course_id = ? AND u.role = 'student'
      `, [courseId]);

      // Create notifications for each student
      const notifications = [];
      for (const student of students) {
        const notification = await this.create({
          user_id: student.id,
          title,
          message,
          type,
          related_entity: 'course',
          related_entity_id: courseId
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Notify course students error:', error);
      throw error;
    }
  }
}

module.exports = Notification;