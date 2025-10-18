const { executeQuery } = require('../config/database');

class Forum {
  static async createPost(postData) {
    try {
      const { course_id, user_id, title, content, post_type } = postData;
      
      if (!course_id || !user_id || !title || !content) {
        throw new Error('Course ID, user ID, title, and content are required');
      }

      const result = await executeQuery(
        `INSERT INTO forum_posts 
         (course_id, user_id, title, content, post_type, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [course_id, user_id, title.trim(), content.trim(), post_type || 'discussion']
      );

      return { 
        id: result.insertId,
        course_id,
        user_id,
        title: title.trim(),
        content: content.trim(),
        post_type: post_type || 'discussion',
        created_at: new Date()
      };
    } catch (error) {
      console.error('Forum post creation error:', error);
      throw error;
    }
  }

  static async createReply(replyData) {
    try {
      const { post_id, user_id, content } = replyData;
      
      if (!post_id || !user_id || !content) {
        throw new Error('Post ID, user ID, and content are required');
      }

      const result = await executeQuery(
        `INSERT INTO forum_replies 
         (post_id, user_id, content, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [post_id, user_id, content.trim()]
      );

      return { 
        id: result.insertId,
        post_id,
        user_id,
        content: content.trim(),
        created_at: new Date()
      };
    } catch (error) {
      console.error('Forum reply creation error:', error);
      throw error;
    }
  }

  static async getCoursePosts(courseId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const rows = await executeQuery(`
        SELECT 
          fp.*,
          u.name as author_name,
          u.role as author_role,
          COUNT(fr.id) as reply_count
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        LEFT JOIN forum_replies fr ON fp.id = fr.post_id
        WHERE fp.course_id = ?
        GROUP BY fp.id
        ORDER BY fp.created_at DESC
        LIMIT ? OFFSET ?
      `, [courseId, limit, offset]);

      return rows;
    } catch (error) {
      console.error('Get course posts error:', error);
      throw error;
    }
  }

  static async getPostWithReplies(postId) {
    try {
      // Get post
      const postRows = await executeQuery(`
        SELECT 
          fp.*,
          u.name as author_name,
          u.role as author_role
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        WHERE fp.id = ?
      `, [postId]);

      if (postRows.length === 0) return null;

      const post = postRows[0];

      // Get replies
      const replyRows = await executeQuery(`
        SELECT 
          fr.*,
          u.name as author_name,
          u.role as author_role
        FROM forum_replies fr
        JOIN users u ON fr.user_id = u.id
        WHERE fr.post_id = ?
        ORDER BY fr.created_at ASC
      `, [postId]);

      return {
        ...post,
        replies: replyRows
      };
    } catch (error) {
      console.error('Get post with replies error:', error);
      throw error;
    }
  }
}

module.exports = Forum;