import React, { useState } from 'react'
import { assignmentService } from '../services/assignmentService'

const CreateAssignmentModal = ({ courseId, isOpen, onClose, onAssignmentCreated }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: 100,
    assignment_type: 'assignment'
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_points' ? parseInt(value) || 0 : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Assignment title is required'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    } else if (new Date(formData.due_date) < new Date()) {
      newErrors.due_date = 'Due date must be in the future'
    }

    if (!formData.max_points || formData.max_points < 1) {
      newErrors.max_points = 'Maximum points must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await assignmentService.createAssignment(courseId, formData)
      onAssignmentCreated()
      handleClose()
    } catch (error) {
      console.error('Failed to create assignment:', error)
      alert(error.response?.data?.message || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      max_points: 100,
      assignment_type: 'assignment'
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Assignment</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">Assignment Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Final Project Submission"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed instructions for the assignment..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignment_type">Assignment Type</label>
                <select
                  id="assignment_type"
                  name="assignment_type"
                  value={formData.assignment_type}
                  onChange={handleChange}
                >
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="max_points">Maximum Points *</label>
                <input
                  type="number"
                  id="max_points"
                  name="max_points"
                  value={formData.max_points}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  className={errors.max_points ? 'error' : ''}
                />
                {errors.max_points && <span className="error-message">{errors.max_points}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="due_date">Due Date *</label>
              <input
                type="datetime-local"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={errors.due_date ? 'error' : ''}
              />
              {errors.due_date && <span className="error-message">{errors.due_date}</span>}
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
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAssignmentModal