import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService' // Add this import

const VerifyEmail = ({ onShowView, onShowNotification }) => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      await authService.verifyEmail()
      onShowNotification('Verification email sent! Please check your inbox.', 'success')
    } catch (error) {
      onShowNotification(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    setLoading(true)
    try {
      const updatedUser = await authService.getProfile()
      updateUser(updatedUser)
      
      if (updatedUser.is_verified) {
        onShowNotification('Email verified successfully!', 'success')
        onShowView('dashboard')
      } else {
        onShowNotification('Email not verified yet. Please check your inbox.', 'warning')
      }
    } catch (error) {
      onShowNotification(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="verify-email-view" className="view">
      <div className="verify-email-page">
        <div className="container">
          <div className="auth-container">
            <div className="auth-card">
              <div className="verification-header">
                <div className="verification-icon">📧</div>
                <h2>Verify Your Email Address</h2>
                <p>We've sent a verification link to your email</p>
              </div>

              <div className="verification-content">
                <div className="user-email">
                  <strong>Email sent to:</strong> <span>{user?.email}</span>
                </div>

                <div className="verification-steps">
                  <h4>To complete your registration:</h4>
                  <ol>
                    <li>Check your email inbox for a message from LearnHub LMS</li>
                    <li>Click the verification link in the email</li>
                    <li>Return to this page or login again</li>
                  </ol>
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  
                  <button 
                    className="btn btn-outline" 
                    onClick={handleCheckVerification}
                    disabled={loading}
                  >
                    {loading ? 'Checking...' : 'I\'ve Verified My Email'}
                  </button>
                </div>

                <div className="troubleshooting">
                  <h4>Didn't receive the email?</h4>
                  <ul>
                    <li>Check your spam or junk folder</li>
                    <li>Verify you entered the correct email address</li>
                    <li>Wait a few minutes - email delivery can take time</li>
                    <li>Contact support if you continue having issues</li>
                  </ul>
                </div>

                <div className="navigation-actions">
                  <button 
                    className="btn btn-outline" 
                    onClick={() => onShowView('login')}
                    disabled={loading}
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail