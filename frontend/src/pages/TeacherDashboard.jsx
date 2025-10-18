import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { assignmentService } from '../services/assignmentService'

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([])
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [coursesResponse] = await Promise.all([
        courseService.getTeacherCourses()
      ])

      setCourses(coursesResponse.data.courses)
      
      // Calculate stats
      const totalStudents = coursesResponse.data.courses.reduce(
        (sum, course) => sum + (course.student_count || 0), 0
      )
      
      setStats({
        totalCourses: coursesResponse.data.courses.length,
        totalStudents,
        averageStudents: coursesResponse.data.courses.length > 0 
          ? Math.round(totalStudents / coursesResponse.data.courses.length) 
          : 0
      })

    } catch (error) {
      console.error('Failed to load teacher dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-dashboard">
            <div className="loading-spinner"></div>
            <p>Loading your teacher dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page teacher-dashboard">
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Teacher Dashboard 🎓</h1>
          <p>Manage your courses and track student progress</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Your Courses</h3>
              <div className="stat-number">{stats.totalCourses}</div>
              <p>Total courses created</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Students</h3>
              <div className="stat-number">{stats.totalStudents}</div>
              <p>Across all courses</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Avg. Students</h3>
              <div className="stat-number">{stats.averageStudents}</div>
              <p>Per course</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Engagement</h3>
              <div className="stat-number">-</div>
              <p>Student activity rate</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Quick Actions */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions-grid">
              <Link to="/teacher/courses/create" className="action-card primary">
                <div className="action-icon">➕</div>
                <h3>Create New Course</h3>
                <p>Start building a new course from scratch</p>
              </Link>
              
              <Link to="/courses" className="action-card success">
                <div className="action-icon">👀</div>
                <h3>Browse Courses</h3>
                <p>Explore other courses on the platform</p>
              </Link>
              
              <div className="action-card info">
                <div className="action-icon">📊</div>
                <h3>View Analytics</h3>
                <p>Detailed insights coming soon</p>
              </div>
            </div>
          </div>

          {/* Your Courses */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Your Courses</h2>
              {courses.length > 0 && (
                <Link to="/teacher/courses/create" className="btn btn-primary btn-sm">
                  Create New
                </Link>
              )}
            </div>
            
            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses created yet</h3>
                <p>Start sharing your knowledge by creating your first course</p>
                <Link to="/teacher/courses/create" className="btn btn-primary">
                  Create Your First Course
                </Link>
              </div>
            ) : (
              <div className="courses-grid compact">
                {courses.map(course => (
                  <TeacherCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Teaching Tips</h2>
            </div>
            
            <div className="tips-list">
              <div className="tip-card">
                <h4>Engage Your Students</h4>
                <p>Use interactive content and regular assignments to keep students engaged with your course material.</p>
              </div>
              
              <div className="tip-card">
                <h4>Provide Timely Feedback</h4>
                <p>Quick feedback on assignments helps students learn faster and stay motivated.</p>
              </div>
              
              <div className="tip-card">
                <h4>Use the Discussion Forum</h4>
                <p>Encourage students to ask questions and discuss topics in the course forum.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TeacherCourseCard = ({ course }) => {
  return (
    <div className="course-card compact teacher">
      <div className="course-header">
        <h4 className="course-title">{course.title}</h4>
        <p className="course-description">
          {course.description.length > 80 
            ? `${course.description.substring(0, 80)}...` 
            : course.description
          }
        </p>
      </div>
      
      <div className="course-stats">
        <div className="stat">
          <span className="stat-number">{course.student_count || 0}</span>
          <span className="stat-label">Students</span>
        </div>
        <div className="stat">
          <span className="stat-number">{course.duration || 'FP'}</span>
          <span className="stat-label">Duration</span>
        </div>
      </div>
      
      <div className="course-actions">
        <Link 
          to={`/teacher/courses/${course.id}/manage`} 
          className="btn btn-primary btn-sm"
        >
          Manage
        </Link>
        <Link 
          to={`/courses/${course.id}`} 
          className="btn btn-outline btn-sm"
        >
          View
        </Link>
      </div>
    </div>
  )
}

export default TeacherDashboard