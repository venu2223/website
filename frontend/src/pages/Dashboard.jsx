import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { courseService } from '../services/courseService'
import { assignmentService } from '../services/assignmentService'

const Dashboard = () => {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [recentAssignments, setRecentAssignments] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [coursesResponse, assignmentsResponse, progressResponse] = await Promise.all([
        courseService.getStudentCourses(),
        assignmentService.getStudentSubmissions(),
        courseService.getStudentProgress()
      ])

      setEnrolledCourses(coursesResponse.data?.enrollments?.slice(0, 4) || [])
      setRecentAssignments(assignmentsResponse.data?.submissions?.slice(0, 3) || [])
      setProgress(progressResponse.data?.progress || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOverallProgress = () => {
    if (progress.length === 0) return 0
    const totalProgress = progress.reduce((sum, course) => sum + course.progress_percentage, 0)
    return Math.round(totalProgress / progress.length)
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-dashboard">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome back, {user.name}! 👋</h1>
          <p>Continue your learning journey and track your progress</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Enrolled Courses</h3>
              <div className="stat-number">{enrolledCourses.length}</div>
              <p>Total courses you're taking</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Overall Progress</h3>
              <div className="stat-number">{getOverallProgress()}%</div>
              <p>Average completion rate</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Assignments</h3>
              <div className="stat-number">{recentAssignments.length}</div>
              <p>Recent submissions</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>Study Time</h3>
              <div className="stat-number">-</div>
              <p>Track your learning hours</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Enrolled Courses */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Your Courses</h2>
              <Link to="/my-courses" className="btn btn-outline btn-sm">
                View All
              </Link>
            </div>
            
            {enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses enrolled yet</h3>
                <p>Start your learning journey by enrolling in courses</p>
                <Link to="/courses" className="btn btn-primary">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="courses-grid compact">
                {enrolledCourses.map(course => (
                  <CourseCard key={course.course_id} course={course} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>
            
            <div className="activity-list">
              {recentAssignments.length === 0 ? (
                <div className="empty-activity">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentAssignments.map(assignment => (
                  <ActivityItem key={assignment.id} assignment={assignment} />
                ))
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Progress Overview</h2>
            </div>
            
            <div className="progress-list">
              {progress.length === 0 ? (
                <div className="empty-progress">
                  <p>Start learning to track your progress</p>
                </div>
              ) : (
                progress.map(courseProgress => (
                  <ProgressItem key={courseProgress.course_id} progress={courseProgress} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CourseCard = ({ course }) => {
  const progress = course.progress?.overall_progress || 0

  return (
    <div className="course-card compact">
      <div className="course-header">
        <h4 className="course-title">{course.course_title}</h4>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{progress}% complete</span>
      </div>
      
      <div className="course-actions">
        <Link 
          to={`/learn/${course.course_id}`} 
          className="btn btn-primary btn-sm"
        >
          {progress > 0 ? 'Continue' : 'Start'}
        </Link>
      </div>
    </div>
  )
}

const ActivityItem = ({ assignment }) => {
  const getStatusColor = () => {
    if (assignment.grade !== null) return 'success'
    return 'info'
  }

  return (
    <div className="activity-item">
      <div className="activity-icon">📝</div>
      <div className="activity-content">
        <h4>{assignment.assignment_title}</h4>
        <p>Submitted on {new Date(assignment.submitted_at).toLocaleDateString()}</p>
        <div className="activity-meta">
          <span className={`status-badge ${getStatusColor()}`}>
            {assignment.grade !== null ? `Graded: ${assignment.grade}/${assignment.max_points}` : 'Pending Review'}
          </span>
          <span className="course-name">{assignment.course_title}</span>
        </div>
      </div>
    </div>
  )
}

const ProgressItem = ({ progress }) => {
  return (
    <div className="progress-item">
      <div className="progress-info">
        <h4>{progress.course_title}</h4>
        <div className="progress-stats">
          <span>{progress.completed_content}/{progress.total_content} lessons</span>
          <span>{progress.progress_percentage}% complete</span>
        </div>
      </div>
      <div className="progress-bar large">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.progress_percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

export default Dashboard