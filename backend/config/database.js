const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lms_db',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

const initDatabase = async () => {
  try {
    // First, create connection without database to create it if needed
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    // Create database if it doesn't exist
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbConfig.database}' is ready`);

    await tempConnection.end();

    // Test the pool connection and create tables
    const connection = await pool.getConnection();
    try {
      // Create users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('student', 'teacher') NOT NULL DEFAULT 'student',
          is_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Users table created/verified');
      // Create courses table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          duration VARCHAR(100),
          teacher_id INT NOT NULL,
          is_published BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_teacher_id (teacher_id),
          INDEX idx_published (is_published)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Courses table created/verified');

      // Create enrollments table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          course_id INT NOT NULL,
          enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          progress_percentage INT DEFAULT 0,
          completed_at TIMESTAMP NULL,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          UNIQUE KEY unique_enrollment (student_id, course_id),
          INDEX idx_student_id (student_id),
          INDEX idx_course_id (course_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

        console.log('✅ Enrollments table created/verified');
        // Create course_content table for videos and materials
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS course_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            content_type ENUM('video', 'document', 'quiz') NOT NULL DEFAULT 'video',
            video_url VARCHAR(500),
            document_url VARCHAR(500),
            duration INT DEFAULT 0, -- in minutes
            display_order INT DEFAULT 0,
            is_published BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            INDEX idx_course_id (course_id),
            INDEX idx_content_type (content_type),
            INDEX idx_display_order (display_order)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Course content table created/verified');

        // Create student_progress table to track video watching
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS student_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            content_id INT NOT NULL,
            progress_percentage INT DEFAULT 0,
            is_completed BOOLEAN DEFAULT FALSE,
            last_position INT DEFAULT 0, -- video position in seconds
            total_time_watched INT DEFAULT 0, -- in seconds
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (content_id) REFERENCES course_content(id) ON DELETE CASCADE,
            UNIQUE KEY unique_progress (student_id, content_id),
            INDEX idx_student_course (student_id, course_id),
            INDEX idx_content (content_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Student progress table created/verified');
        // Create assignments table
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date TIMESTAMP NULL,
            max_points INT NOT NULL DEFAULT 100,
            assignment_type ENUM('assignment', 'quiz', 'exam') DEFAULT 'assignment',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            INDEX idx_course_id (course_id),
            INDEX idx_due_date (due_date)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Assignments table created/verified');

        // Create submissions table
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            assignment_id INT NOT NULL,
            student_id INT NOT NULL,
            submission_text TEXT,
            file_url VARCHAR(500),
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            grade DECIMAL(5,2),
            feedback TEXT,
            graded_at TIMESTAMP NULL,
            graded_by INT NULL,
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_submission (assignment_id, student_id),
            INDEX idx_assignment_id (assignment_id),
            INDEX idx_student_id (student_id),
            INDEX idx_submitted_at (submitted_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
      
        console.log('✅ Submissions table created/verified');
        // Create forum_posts table
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS forum_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            post_type ENUM('discussion', 'question', 'announcement') DEFAULT 'discussion',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_course_id (course_id),
            INDEX idx_user_id (user_id),
            INDEX idx_post_type (post_type)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Forum posts table created/verified');

        // Create forum_replies table
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS forum_replies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            user_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_post_id (post_id),
            INDEX idx_user_id (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Forum replies table created/verified');

        // Create notifications table
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
            related_entity ENUM('course', 'assignment', 'submission', 'forum') NULL,
            related_entity_id INT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_is_read (is_read),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Notifications table created/verified');
    } finally {
      connection.release(); // Always release the connection back to the pool
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Get a connection from the pool
const getConnection = async () => {
  return await pool.getConnection();
};

// Execute a query with automatic connection management
const executeQuery = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Health check for the pool
const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

module.exports = { 
  pool,
  getConnection,
  executeQuery,
  healthCheck,
  initDatabase 
};