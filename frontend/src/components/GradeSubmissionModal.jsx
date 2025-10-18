import React, { useState } from 'react'
import { assignmentService } from '../services/assignmentService'

const GradeSubmissionModal = ({ submission, assignment, isOpen, onClose, onGraded }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    grade: '',
    feedback: ''
  })
  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    if (submission) {
      setFormData({
        grade: submission.grade || '',
        feedback: submission.feedback || ''
      })
    }
  }, [submission])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'grade' ? (value === '' ? '' : Math.max(0, Math.min(assignment.max_points, parseInt(value) || 0))) : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (formData.grade === '') {
      newErrors.grade = 'Grade is required'
    } else if (formData.grade < 0 || formData.grade > assignment.max_points) {
      newErrors.grade = `Grade must be between 0 and ${assignment.max_points}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await assignmentService.gradeSubmission(submission.id, formData)
      onGraded()
      handleClose()
    } catch (error) {
      console.error('Failed to grade submission:', error)
      alert(error.response?.data?.message || 'Failed to grade submission')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      grade: '',
      feedback: ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Grade Submission</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="submission-info">
              <h3>Student: {submission.student_name}</h3>
              <p><strong>Assignment:</strong> {assignment.title}</p>
              <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
              <p><strong>Max Points:</strong> {assignment.max_points}</p>
            </div>

            {submission.submission_text && (
              <div className="submission-content">
                <h4>Text Submission:</h4>
                <div className="submission-text">
                  {submission.submission_text}
                </div>
              </div>
            )}

            {submission.file_url && (
              <div className="submission-file">
                <h4>Attached File:</h4>
                <a 
                  href={submission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  📎 Download Submitted File
                </a>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="grade">Grade *</label>
              <div className="grade-input-container">
                <input
                  type="number"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  min="0"
                  max={assignment.max_points}
                  className={errors.grade ? 'error' : ''}
                />
                <span className="grade-max">/ {assignment.max_points}</span>
              </div>
              {errors.grade && <span className="error-message">{errors.grade}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="feedback">Feedback</label>
              <textarea
                id="feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                placeholder="Provide constructive feedback to help the student improve..."
                rows="4"
              />
              <div className="help-text">
                This feedback will be visible to the student.
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
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
              {loading ? 'Grading...' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GradeSubmissionModal