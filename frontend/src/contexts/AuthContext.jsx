import React, { createContext, useState, useContext, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is authenticated on app load
  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      setLoading(false)
      return
    }

    try {
      // First, set the user from localStorage immediately to prevent redirect
      const userData = JSON.parse(userStr)
      setUser(userData)
      setError(null)
      
      // Then try to verify with the server (but don't block the UI)
      try {
        const freshUserData = await authService.getProfile()
        setUser(freshUserData)
        localStorage.setItem('user', JSON.stringify(freshUserData))
      } catch (serverError) {
        console.warn('Server profile check failed, but keeping local session:', serverError)
        // Don't logout if server check fails - keep the local session
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Only logout if there's a critical error, not for network issues
      if (error.type === 'UNAUTHORIZED' || error.type === 'INVALID_TOKEN') {
        handleAuthError(error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle authentication errors
  const handleAuthError = (error) => {
    const errorType = error.type || 'UNKNOWN_ERROR'
    
    switch (errorType) {
      case 'UNAUTHORIZED':
      case 'INVALID_TOKEN':
        console.log('Session expired, logging out...')
        logout()
        break
      case 'NETWORK_ERROR':
        console.warn('Network error during auth check, keeping local session')
        // Don't logout for network errors - keep the user logged in
        setError({
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection.',
          suggestion: 'You can continue using the app with limited functionality.'
        })
        break
      default:
        console.warn('Auth error, but keeping session:', error)
        setError({
          type: 'AUTH_ERROR',
          message: 'Authentication issue detected.',
          suggestion: 'Try refreshing the page or logging out and back in.'
        })
    }
  }

  // Login function
  const login = async (userData, token) => {
    try {
      setUser(userData)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setError(null)
      
      // Store login timestamp for session management
      localStorage.setItem('loginTime', new Date().toISOString())
    } catch (error) {
      console.error('Login error in context:', error)
      setError({
        type: 'LOGIN_ERROR',
        message: 'Failed to complete login process.',
        suggestion: 'Please try again.'
      })
      throw error
    }
  }

  // Logout function
  const logout = () => {
    try {
      setUser(null)
      setError(null)
      
      // Clear all auth-related data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('loginTime')
      
    } catch (error) {
      console.error('Logout error:', error)
      setError({
        type: 'LOGOUT_ERROR',
        message: 'Failed to logout properly.',
        suggestion: 'Please try again or clear browser storage.'
      })
    }
  }

  // Update user data
  const updateUser = (updatedUserData) => {
    try {
      const mergedUser = { ...user, ...updatedUserData }
      setUser(mergedUser)
      localStorage.setItem('user', JSON.stringify(mergedUser))
    } catch (error) {
      console.error('Update user error:', error)
      setError({
        type: 'UPDATE_ERROR',
        message: 'Failed to update user information.',
        suggestion: 'Please try again.'
      })
    }
  }

  // Refresh user data from server
  const refreshUser = async () => {
    if (!user) return
    
    try {
      const userData = await authService.getProfile()
      updateUser(userData)
    } catch (error) {
      console.error('Refresh user error:', error)
      handleAuthError(error)
    }
  }

  // Check if token is expired
  const isTokenExpired = () => {
    const token = localStorage.getItem('token')
    if (!token) return true

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]))
      const isExpired = tokenData.exp * 1000 < Date.now()
      
      if (isExpired) {
        console.log('Token expired, logging out...')
        logout()
      }
      
      return isExpired
    } catch (error) {
      console.error('Token validation error:', error)
      return true
    }
  }

  // Check session duration (optional: auto-logout after certain time)
  const checkSessionDuration = () => {
    const loginTime = localStorage.getItem('loginTime')
    if (!loginTime) return

    const loginDate = new Date(loginTime)
    const now = new Date()
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60)

    // Auto-logout after 24 hours (optional)
    if (hoursDiff > 24) {
      console.log('Session too long, logging out...')
      logout()
    }
  }

  // Clear errors
  const clearError = () => {
    setError(null)
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  // Check if user is verified
  const isVerified = () => {
    return user?.is_verified === true
  }

  // Get user permissions based on role
  const getPermissions = () => {
    if (!user) return {}
    
    const basePermissions = {
      canViewCourses: true,
      canBrowse: true,
    }

    if (user.role === 'student') {
      return {
        ...basePermissions,
        canEnroll: true,
        canSubmitAssignments: true,
        canViewProgress: true,
        canAccessCoursePlayer: true,
      }
    }

    if (user.role === 'teacher') {
      return {
        ...basePermissions,
        canCreateCourses: true,
        canManageCourses: true,
        canGradeAssignments: true,
        canViewAnalytics: true,
      }
    }

    return basePermissions
  }

  // Initialize auth check on component mount
  useEffect(() => {
    checkAuth()
    
    // Set up periodic auth checks (every 5 minutes)
    const authCheckInterval = setInterval(() => {
      const token = localStorage.getItem('token')
      if (token) {
        isTokenExpired()
        checkSessionDuration()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(authCheckInterval)
  }, []) // Remove [user] dependency to prevent infinite re-renders

  // Value provided to consumers
  const value = {
    // State
    user,
    loading,
    error,
    
    // Actions
    login,
    logout,
    updateUser,
    refreshUser,
    clearError,
    
    // Utilities
    hasRole,
    isVerified,
    getPermissions,
    isAuthenticated: !!user && !isTokenExpired(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}