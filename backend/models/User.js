const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      const { name, email, password, role } = userData;
      
      // Validate required fields
      if (!name || !email || !password || !role) {
        throw new Error('All fields are required');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await db.executeQuery(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
      );

      // Return user data without password
      return { 
        id: result.insertId, 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        role, 
        is_verified: false 
      };
    } catch (error) {
      console.error('User creation error:', error);
      
      // Handle duplicate email error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User already exists with this email');
      }
      
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT id, name, email, role, is_verified, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Find user by ID error:', error);
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      throw error;
    }
  }

  static async updateVerification(userId) {
    try {
      await db.executeQuery(
        'UPDATE users SET is_verified = TRUE WHERE id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Update verification error:', error);
      throw error;
    }
  }

  // Test method to check database connection
  static async testConnection() {
    try {
      const result = await db.executeQuery('SELECT 1 as test');
      return result[0].test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

module.exports = User;