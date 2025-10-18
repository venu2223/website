import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { useAuth } from '../contexts/AuthContext'

const CourseCatalog = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCourses, setFilteredCourses] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCourses(filtered)
  }, [searchTerm, courses])

  const loadCourses = async () => {
    try {
      const response = await courseService.getAllCourses()
      setCourses(response.data.courses)
      setFilteredCourses(response.data.courses)
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    if (!user) {
      alert('Please login to enroll in courses')
      return
    }

    try {
      await courseService.enrollInCourse(courseId)
      alert('Successfully enrolled in the course!')
      loadCourses() // Refresh to update enrollment status
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to enroll in course')
    }
  }

  if (loading) {
    return (
      <div className="catalog-page">
        <div className="container">
          <div className="loading-courses">
            <div className="loading-spinner"></div>
            <p>Loading courses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="catalog-page">
      <div className="container">
        {/* Header */}
        <div className="catalog-header">
          <div className="header-content">
            <h1>Explore Our Courses</h1>
            <p>Discover a wide range of courses taught by expert instructors</p>
          </div>
          
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search courses, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="catalog-content">
          <div className="courses-grid">
            {filteredCourses.length === 0 ? (
              <div className="no-courses">
                <h3>No courses found</h3>
                <p>Try adjusting your search terms or browse all courses</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="btn btn-primary"
                  >
                    Show All Courses
                  </button>
                )}
              </div>
            ) : (
              filteredCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onEnroll={handleEnroll}
                  user={user}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Course Card Component
const CourseCard = ({ course, onEnroll, user }) => {
  const isEnrolled = course.isEnrolled || false

  return (
    <div className="course-card">
      <div className="course-image">
        <div className="image-placeholder">
          <span className="course-icon">📚</span>
        </div>
        <div className="course-badge">
          {course.student_count} {course.student_count === 1 ? 'student' : 'students'}
        </div>
      </div>
      
      <div className="course-content">
        <div className="course-header">
          <h3 className="course-title">{course.title}</h3>
          <p className="course-instructor">By {course.teacher_name}</p>
        </div>
        
        <p className="course-description">
          {course.description.length > 120 
            ? `${course.description.substring(0, 120)}...` 
            : course.description
          }
        </p>
        
        <div className="course-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{course.duration || 'Self-paced'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">👥</span>
            <span>{course.student_count} enrolled</span>
          </div>
        </div>
        
        <div className="course-actions">
          <Link to={`/courses/${course.id}`} className="btn btn-outline">
            View Details
          </Link>
          
          {user && user.role === 'student' && (
            isEnrolled ? (
              <Link to={`/learn/${course.id}`} className="btn btn-primary">
                Continue Learning
              </Link>
            ) : (
              <button 
                onClick={() => onEnroll(course.id)}
                className="btn btn-primary"
              >
                Enroll Now
              </button>
            )
          )}
          
          {!user && (
            <Link to="/login" className="btn btn-primary">
              Login to Enroll
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseCatalog