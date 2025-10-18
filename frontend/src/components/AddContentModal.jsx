import React, { useState } from 'react'
import { courseService } from '../services/courseService'

const AddContentModal = ({ courseId, isOpen, onClose, onContentAdded }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'video',
    duration: 0,
    display_order: 0,
    video_file: null,
    document_file: null
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Content title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.content_type) {
      newErrors.content_type = 'Content type is required'
    }

    // Validate files based on content type
    if (formData.content_type === 'video' && !formData.video_file) {
      newErrors.video_file = 'Video file is required for video content'
    }

    if (formData.content_type === 'document' && !formData.document_file) {
      newErrors.document_file = 'Document file is required for document content'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const contentData = new FormData()
      
      // Use exact field names that backend expects
      contentData.append('title', formData.title.trim())
      contentData.append('description', formData.description.trim())
      contentData.append('content_type', formData.content_type)
      contentData.append('duration', formData.duration.toString())
      contentData.append('display_order', formData.display_order.toString())

      // FIXED: Use correct field names that backend expects
      if (formData.video_file) {
        contentData.append('video', formData.video_file)  // ✅ Changed from 'video_file'
      }

      if (formData.document_file) {
        contentData.append('document', formData.document_file)  // ✅ Changed from 'document_file'
      }

      await courseService.addCourseContent(courseId, contentData)
      onContentAdded()
      handleClose()
    } catch (error) {
      console.error('Failed to add content:', error)
      alert('Failed to add content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'video',
      duration: 0,
      display_order: 0,
      video_file: null,
      document_file: null
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Course Content</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">Content Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Introduction to React"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of this content..."
                rows="3"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="content_type">Content Type *</label>
                <select
                  id="content_type"
                  name="content_type"
                  value={formData.content_type}
                  onChange={handleChange}
                  className={errors.content_type ? 'error' : ''}
                >
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="quiz">Quiz</option>
                </select>
                {errors.content_type && <span className="error-message">{errors.content_type}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="display_order">Display Order</label>
                <input
                  type="number"
                  id="display_order"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            {/* File upload based on content type */}
            {formData.content_type === 'video' && (
              <div className="form-group">
                <label htmlFor="video_file">Video File *</label>
                <input
                  type="file"
                  id="video_file"
                  name="video_file"
                  accept="video/*"
                  onChange={handleChange}
                  className={errors.video_file ? 'error' : ''}
                />
                <small>Supported formats: MP4, MOV, AVI, WebM (Max 50MB)</small>
                {errors.video_file && <span className="error-message">{errors.video_file}</span>}
                {formData.video_file && (
                  <div className="file-preview">
                    Selected: {formData.video_file.name}
                  </div>
                )}
              </div>
            )}

            {formData.content_type === 'document' && (
              <div className="form-group">
                <label htmlFor="document_file">Document File *</label>
                <input
                  type="file"
                  id="document_file"
                  name="document_file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleChange}
                  className={errors.document_file ? 'error' : ''}
                />
                <small>Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT (Max 50MB)</small>
                {errors.document_file && <span className="error-message">{errors.document_file}</span>}
                {formData.document_file && (
                  <div className="file-preview">
                    Selected: {formData.document_file.name}
                  </div>
                )}
              </div>
            )}

            {formData.content_type === 'quiz' && (
              <div className="form-group">
                <label>Quiz Content</label>
                <div className="info-message">
                  <p>Quiz functionality coming soon! For now, you can create quiz content with a title and description.</p>
                </div>
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
              {loading ? 'Adding Content...' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddContentModal