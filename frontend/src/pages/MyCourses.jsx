import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { courseService } from '../services/courseService'

const MyCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, in-progress, completed

  useEffect(() => {
    loadEnrolledCourses()
  }, [])

  const loadEnrolledCourses = async () => {
    try {
      const response = await courseService.getStudentCourses()
      setEnrolledCourses(response.data.enrollments)
    } catch (error) {
      console.error('Failed to load enrolled courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = enrolledCourses.filter(course => {
    const progress = course.progress?.overall_progress || 0
    
    if (filter === 'completed') return progress >= 90
    if (filter === 'in-progress') return progress > 0 && progress < 90
    return true // 'all'
  })

  const getCourseStatus = (progress) => {
    if (progress >= 90) return 'completed'
    if (progress > 0) return 'in-progress'
    return 'not-started'
  }

  if (loading) {
    return (
      <div className="my-courses-page">
        <div className="container">
          <div className="loading-courses">
            <div className="loading-spinner"></div>
            <p>Loading your courses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-courses-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>My Courses</h1>
            <p>Manage and continue your learning journey</p>
          </div>
          
          <Link to="/courses" className="btn btn-primary">
            Browse More Courses
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Courses ({enrolledCourses.length})
          </button>
          <button 
            className={`tab ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({enrolledCourses.filter(c => (c.progress?.overall_progress || 0) > 0 && (c.progress?.overall_progress || 0) < 90).length})
          </button>
          <button 
            className={`tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({enrolledCourses.filter(c => (c.progress?.overall_progress || 0) >= 90).length})
          </button>
        </div>

        {/* Courses Grid */}
        <div className="courses-section">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {filter === 'all' ? '📚' : filter === 'in-progress' ? '🚀' : '🎓'}
              </div>
              <h3>
                {filter === 'all' 
                  ? 'No courses enrolled yet' 
                  : filter === 'in-progress' 
                  ? 'No courses in progress'
                  : 'No courses completed yet'
                }
              </h3>
              <p>
                {filter === 'all' 
                  ? 'Start your learning journey by enrolling in courses' 
                  : filter === 'in-progress' 
                  ? 'Start learning to see your progress here'
                  : 'Complete courses to see them here'
                }
              </p>
              <Link to="/courses" className="btn btn-primary">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="courses-grid detailed">
              {filteredCourses.map(course => (
                <EnrolledCourseCard 
                  key={course.course_id} 
                  course={course} 
                  onUpdate={loadEnrolledCourses}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const EnrolledCourseCard = ({ course, onUpdate }) => {
  const progress = course.progress?.overall_progress || 0
  const status = getCourseStatus(progress)

  const getStatusInfo = () => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: 'success', icon: '🎓' }
      case 'in-progress':
        return { label: 'In Progress', color: 'warning', icon: '🚀' }
      default:
        return { label: 'Not Started', color: 'info', icon: '📚' }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="enrolled-course-card">
      <div className="course-header">
        <div className="course-image">
          <div className="image-placeholder">
            <span className="course-icon">📚</span>
          </div>
          <div className="status-badge">
            <span className={`badge ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>
        </div>
        
        <div className="course-content">
          <h3 className="course-title">{course.course_title}</h3>
          <p className="course-instructor">By {course.teacher_name}</p>
          <p className="course-description">
            {course.course_description?.length > 120 
              ? `${course.course_description.substring(0, 120)}...` 
              : course.course_description
            }
          </p>
          
          <div className="course-progress">
            <div className="progress-header">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${status}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-stats">
              <span>
                {course.progress?.completed_content || 0} of {course.progress?.total_content || 0} lessons completed
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="course-actions">
        <Link 
          to={`/learn/${course.course_id}`} 
          className="btn btn-primary"
        >
          {status === 'completed' ? 'Review' : status === 'in-progress' ? 'Continue' : 'Start Learning'}
        </Link>
        
        <Link 
          to={`/courses/${course.course_id}`} 
          className="btn btn-outline"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

const getCourseStatus = (progress) => {
  if (progress >= 90) return 'completed'
  if (progress > 0) return 'in-progress'
  return 'not-started'
}

export default MyCourses