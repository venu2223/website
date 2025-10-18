import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { useAuth } from '../contexts/AuthContext'

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadCourseDetails()
  }, [courseId])

  const loadCourseDetails = async () => {
    try {
      const response = await courseService.getCourseDetails(courseId)
      setCourse(response.data.course)
      setContent(response.data.content)
    } catch (error) {
      console.error('Failed to load course details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      await courseService.enrollInCourse(courseId)
      alert('Successfully enrolled in the course!')
      navigate(`/learn/${courseId}`)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to enroll in course')
    }
  }

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="container">
          <div className="loading-course">
            <div className="loading-spinner"></div>
            <p>Loading course details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <div className="container">
          <div className="error-state">
            <h2>Course not found</h2>
            <p>The course you're looking for doesn't exist.</p>
            <Link to="/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="course-detail-page">
      <div className="container">
        {/* Course Header */}
        <div className="course-hero">
          <div className="hero-content">
            <nav className="breadcrumb">
              <Link to="/courses">Courses</Link>
              <span> / </span>
              <span>{course.title}</span>
            </nav>
            
            <h1 className="course-title">{course.title}</h1>
            <p className="course-instructor">Taught by {course.teacher_name}</p>
            
            <div className="course-stats">
              <div className="stat">
                <span className="stat-number">{course.student_count || 0}</span>
                <span className="stat-label">Students</span>
              </div>
              <div className="stat">
                <span className="stat-number">{content.length}</span>
                <span className="stat-label">Lessons</span>
              </div>
              <div className="stat">
                <span className="stat-number">{course.duration || 'Self-paced'}</span>
                <span className="stat-label">Duration</span>
              </div>
            </div>

            <div className="hero-actions">
              {user && user.role === 'student' ? (
                course.isEnrolled ? (
                  <Link to={`/learn/${course.id}`} className="btn btn-primary btn-large">
                    Continue Learning
                  </Link>
                ) : (
                  <button onClick={handleEnroll} className="btn btn-primary btn-large">
                    Enroll in Course
                  </button>
                )
              ) : !user ? (
                <Link to="/login" className="btn btn-primary btn-large">
                  Login to Enroll
                </Link>
              ) : null}
              
              {user && user.role === 'teacher' && user.id === course.teacher_id && (
                <Link to={`/teacher/courses/${course.id}/manage`} className="btn btn-outline">
                  Manage Course
                </Link>
              )}
            </div>
          </div>
          
          <div className="hero-image">
            <div className="image-placeholder-large">
              <span className="course-icon-large">📚</span>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="course-content-section">
          <div className="content-overview">
            <h2>What you'll learn</h2>
            <div className="description">
              <p>{course.description}</p>
            </div>
          </div>

          {/* Curriculum */}
          <div className="curriculum-section">
            <h2>Course Content</h2>
            <div className="curriculum-list">
              {content.length === 0 ? (
                <div className="empty-curriculum">
                  <p>No content available yet.</p>
                </div>
              ) : (
                content.map((item, index) => (
                  <div key={item.id} className="curriculum-item">
                    <div className="item-header">
                      <span className="item-number">{index + 1}</span>
                      <div className="item-info">
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                      </div>
                      <div className="item-meta">
                        <span className="item-type">{item.content_type}</span>
                        {item.duration > 0 && (
                          <span className="item-duration">{item.duration} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructor */}
          <div className="instructor-section">
            <h2>About the Instructor</h2>
            <div className="instructor-card">
              <div className="instructor-avatar">
                <span className="avatar-placeholder">👨‍🏫</span>
              </div>
              <div className="instructor-info">
                <h3>{course.teacher_name}</h3>
                <p className="instructor-email">{course.teacher_email}</p>
                <p className="instructor-bio">
                  Experienced instructor dedicated to providing quality education 
                  and helping students achieve their learning goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail