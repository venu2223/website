import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
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
      console.log('1. Starting login process...')
      
      // CRITICAL: Make sure we're sending the correct data structure
      const loginData = {
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      }
      
      console.log('Sending login data:', loginData)
      const response = await authService.login(loginData)
      console.log('2. Login API response:', response)
      
      // IMPORTANT: Check if response structure is correct
      if (response && response.data) {
        console.log('3. Calling authContext login...')
        await login(response.data.user, response.data.token)
        console.log('4. AuthContext login completed')
        
        // Redirect to dashboard
        console.log('5. Navigating to dashboard...')
        navigate('/dashboard')
      } else {
        throw new Error('Invalid response from server')
      }
      
    } catch (error) {
      console.error('Login error details:', error)
      
      // IMPROVED ERROR HANDLING: Handle both structured and unstructured errors
      if (error && typeof error === 'object') {
        if (error.type === 'NO_ACCOUNT' || error.message?.includes('No account found')) {
          setApiError(error.message || 'No account found with this email address.')
          setErrorDetails({
            suggestion: error.suggestion || 'Please check your email or create a new account.',
            type: 'NO_ACCOUNT'
          })
        } 
        else if (error.type === 'INVALID_PASSWORD' || error.message?.includes('Incorrect password') || error.message?.includes('Invalid password')) {
          setApiError(error.message || 'Incorrect password.')
          setErrorDetails({
            suggestion: error.suggestion || 'Please check your password and try again.',
            type: 'INVALID_PASSWORD'
          })
        } 
        else if (error.type === 'ROLE_MISMATCH' || error.message?.includes('registered as a')) {
          // Extract role information from message if not provided in structured format
          const actualRole = error.actualRole || (error.message?.match(/registered as a (\w+)/)?.[1] || 'user')
          const requestedRole = error.requestedRole || formData.role
          
          setApiError(error.message || `This email is registered as a ${actualRole}, not a ${requestedRole}.`)
          setErrorDetails({
            suggestion: error.suggestion || `Please log in using the ${actualRole} option.`,
            type: 'ROLE_MISMATCH',
            actualRole: actualRole
          })
        } 
        else if (error.type === 'NETWORK_ERROR' || error.code === 'NETWORK_ERROR') {
          setApiError(error.message || 'Unable to connect to the server.')
          setErrorDetails({
            suggestion: error.suggestion || 'Please check your internet connection and try again.',
            type: 'NETWORK_ERROR'
          })
        }
        else if (error.response?.status === 401) {
          // Generic 401 error from backend
          setApiError(error.message || 'Authentication failed.')
          setErrorDetails({
            suggestion: 'Please check your credentials and try again.',
            type: 'AUTH_ERROR'
          })
        }
        else {
          // Handle any other error format
          setApiError(error.message || 'Login failed. Please try again.')
          setErrorDetails({
            suggestion: 'Please check your credentials and try again.',
            type: 'UNKNOWN_ERROR'
          })
        }
      } else {
        // Fallback for non-object errors
        setApiError('Login failed. Please try again.')
        setErrorDetails({
          suggestion: 'Please check your credentials and try again.',
          type: 'UNKNOWN_ERROR'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSuggestion = () => {
    if (errorDetails?.type === 'ROLE_MISMATCH' && errorDetails.actualRole) {
      setFormData(prev => ({
        ...prev,
        role: errorDetails.actualRole
      }))
      setApiError('')
      setErrorDetails(null)
    }
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
            <h1>Welcome Back</h1>
            <p>Sign in to your account to continue learning</p>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className={`api-error ${errorDetails?.type || 'generic-error'}`}>
              <div className="error-icon">
                {errorDetails?.type === 'NETWORK_ERROR' ? '🔌' : '⚠️'}
              </div>
              <div className="error-content">
                <p className="error-message">{apiError}</p>
                {errorDetails?.suggestion && (
                  <p className="error-suggestion">{errorDetails.suggestion}</p>
                )}
                {errorDetails?.type === 'ROLE_MISMATCH' && errorDetails.actualRole && (
                  <button 
                    className="suggestion-action"
                    onClick={handleRoleSuggestion}
                    type="button"
                  >
                    Switch to {errorDetails.actualRole} login
                  </button>
                )}
                {errorDetails?.type === 'NO_ACCOUNT' && (
                  <div className="suggestion-action">
                    <Link to="/register">Create a new account</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
                disabled={loading}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>

        <div className="auth-features">
          <h2>Continue Your Journey</h2>
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">📚</span>
              <div>
                <h3>Access Courses</h3>
                <p>Return to your learning materials and continue where you left off</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <div>
                <h3>Track Progress</h3>
                <p>Monitor your achievements and learning statistics</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">👥</span>
              <div>
                <h3>Join Discussions</h3>
                <p>Participate in course forums and connect with peers</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <div>
                <h3>Achieve Goals</h3>
                <p>Complete assignments and earn certificates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login