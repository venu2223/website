import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { useAuth } from '../contexts/AuthContext'

const CreateCourse = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    is_published: true
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required'
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await courseService.createCourse(formData)
      alert('Course created successfully!')
      navigate(`/teacher/courses/${response.data.course.id}/manage`)
    } catch (error) {
      console.error('Failed to create course:', error)
      alert(error.response?.data?.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-course-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>Create New Course</h1>
            <p>Share your knowledge and create an amazing learning experience</p>
          </div>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="btn btn-outline"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="create-course-form">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Course Information</h2>
              
              <div className="form-group">
                <label htmlFor="title">Course Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Web Development"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
                <div className="help-text">
                  Make it descriptive and engaging. This is what students will see first.
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Course Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what students will learn in this course, what prerequisites are needed, and who this course is for..."
                  rows="6"
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
                <div className="help-text">
                  Be detailed and clear about what students will achieve.
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Estimated Duration</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., 8 weeks, 20 hours, Self-paced"
                  />
                  <div className="help-text">
                    How long will it take to complete this course?
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Publish course immediately
                  </label>
                  <div className="help-text">
                    If unchecked, the course will be saved as a draft.
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            </div>
          </form>

          {/* Creation Tips */}
          <div className="creation-tips">
            <h3>Course Creation Tips</h3>
            <div className="tips-list">
              <div className="tip">
                <strong>Clear Learning Objectives</strong>
                <p>Define what students will be able to do after completing your course.</p>
              </div>
              <div className="tip">
                <strong>Engaging Content</strong>
                <p>Use a mix of videos, readings, and activities to keep students engaged.</p>
              </div>
              <div className="tip">
                <strong>Structured Curriculum</strong>
                <p>Organize content logically from basic to advanced concepts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCourse