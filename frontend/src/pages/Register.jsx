import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [errorDetails, setErrorDetails] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (apiError) {
      setApiError('')
      setErrorDetails(null)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setErrorDetails(null)
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const { confirmPassword, ...submitData } = formData
      const response = await authService.register(submitData)
      
      // Auto-login after successful registration
      await login(response.data.user, response.data.token)
      
      // Redirect to dashboard
      navigate('/dashboard')
      
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different error formats from authService
      if (error.type === 'USER_EXISTS') {
        setApiError(error.message)
        setErrorDetails({
          suggestion: error.suggestion || 'Please try logging in or use a different email address.',
          type: 'USER_EXISTS',
          existingRole: error.existingRole
        })
      } else if (error.type === 'VALIDATION_ERROR') {
        // Handle backend validation errors
        const backendErrors = {}
        error.errors?.forEach(err => {
          backendErrors[err.path] = err.msg
        })
        setErrors(backendErrors)
      } else if (error.type === 'NETWORK_ERROR') {
        setApiError(error.message)
        setErrorDetails({
          suggestion: error.suggestion || 'Please check your internet connection and try again.',
          type: 'NETWORK_ERROR'
        })
      } else {
        // Handle regular Error objects
        setApiError(error.message || 'Registration failed. Please try again.')
        setErrorDetails({
          suggestion: 'Please check your information and try again.',
          type: 'UNKNOWN_ERROR'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuggestion = () => {
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="logo">
              <span className="logo-icon">📚</span>
              LearnHub LMS
            </Link>
            <h1>Create Your Account</h1>
            <p>Join thousands of learners and instructors</p>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="api-error">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <p className="error-message">{apiError}</p>
                {errorDetails?.suggestion && (
                  <p className="error-suggestion">{errorDetails.suggestion}</p>
                )}
                {errorDetails?.type === 'USER_EXISTS' && (
                  <button 
                    className="suggestion-action"
                    onClick={handleLoginSuggestion}
                    type="button"
                  >
                    Sign in to your account
                  </button>
                )}
                {errorDetails?.type === 'NETWORK_ERROR' && (
                  <button 
                    className="suggestion-action"
                    onClick={() => window.location.reload()}
                    type="button"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={errors.name ? 'error' : ''}
                disabled={loading}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
                disabled={loading}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className={errors.password ? 'error' : ''}
                disabled={loading}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
              <div className="help-text">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={loading}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="role">I am a</label>
              <div className="role-selection">
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="radio-custom"></span>
                  <div className="role-content">
                    <span className="role-icon">🎓</span>
                    <div>
                      <strong>Student</strong>
                      <p>I want to learn and take courses</p>
                    </div>
                  </div>
                </label>

                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="radio-custom"></span>
                  <div className="role-content">
                    <span className="role-icon">👨‍🏫</span>
                    <div>
                      <strong>Teacher</strong>
                      <p>I want to create and teach courses</p>
                    </div>
                  </div>
                </label>
              </div>
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="auth-features">
          <h2>Why Join LearnHub?</h2>
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <div>
                <h3>Learn Effectively</h3>
                <p>Access high-quality courses with expert instructors</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🚀</span>
              <div>
                <h3>Progress Tracking</h3>
                <p>Monitor your learning journey with detailed analytics</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">👥</span>
              <div>
                <h3>Community</h3>
                <p>Connect with learners and instructors worldwide</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">💼</span>
              <div>
                <h3>Career Growth</h3>
                <p>Develop skills that matter in today's job market</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register