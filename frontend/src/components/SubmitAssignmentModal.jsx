import React, { useState } from 'react'
import { assignmentService } from '../services/assignmentService'

const SubmitAssignmentModal = ({ assignment, isOpen, onClose, onSubmissionCreated }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    submission_text: '',
    file: null
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.submission_text.trim() && !formData.file) {
      newErrors.submission_text = 'Either text submission or file upload is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const submissionData = new FormData()
      
      if (formData.submission_text) {
        submissionData.append('submission_text', formData.submission_text)
      }
      
      if (formData.file) {
        submissionData.append('file', formData.file)
      }

      await assignmentService.submitAssignment(assignment.id, submissionData)
      onSubmissionCreated()
      handleClose()
    } catch (error) {
      console.error('Failed to submit assignment:', error)
      alert(error.response?.data?.message || 'Failed to submit assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      submission_text: '',
      file: null
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Submit Assignment</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="assignment-info">
              <h3>{assignment.title}</h3>
              <p><strong>Due:</strong> {new Date(assignment.due_date).toLocaleString()}</p>
              <p><strong>Points:</strong> {assignment.max_points}</p>
            </div>

            <div className="form-group">
              <label htmlFor="submission_text">Text Submission</label>
              <textarea
                id="submission_text"
                name="submission_text"
                value={formData.submission_text}
                onChange={handleChange}
                placeholder="Type your submission here... You can also upload a file below."
                rows="6"
                className={errors.submission_text ? 'error' : ''}
              />
              {errors.submission_text && <span className="error-message">{errors.submission_text}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="file">File Upload (Optional)</label>
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.txt,.zip"
              />
              <div className="help-text">
                Supported formats: PDF, Word documents, Text files, ZIP (Max: 10MB)
              </div>
            </div>

            {formData.file && (
              <div className="file-preview">
                <strong>Selected file:</strong> {formData.file.name}
              </div>
            )}
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
              {loading ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmitAssignmentModal