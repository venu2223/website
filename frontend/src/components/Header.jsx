import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActiveRoute = (path) => {
    return location.pathname === path
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="logo">
            <span className="logo-icon">📚</span>
            LearnHub LMS
          </Link>
          
          {/* Navigation */}
          <nav className="nav">
            {!user ? (
              // Guest Navigation
              <div className="nav-links">
                <Link 
                  to="/courses" 
                  className={`nav-link ${isActiveRoute('/courses') ? 'active' : ''}`}
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              // Authenticated User Navigation
              <div className="nav-links">
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                
                <Link 
                  to="/courses" 
                  className={`nav-link ${isActiveRoute('/courses') ? 'active' : ''}`}
                >
                  Browse Courses
                </Link>

                {user.role === 'student' && (
                  <Link 
                    to="/my-courses" 
                    className={`nav-link ${isActiveRoute('/my-courses') ? 'active' : ''}`}
                  >
                    My Courses
                  </Link>
                )}

                {user.role === 'teacher' && (
                  <Link 
                    to="/teacher/dashboard" 
                    className={`nav-link ${isActiveRoute('/teacher/dashboard') ? 'active' : ''}`}
                  >
                    Teacher Dashboard
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* Auth Section */}
          <div className="auth-section">
            {!user ? (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            ) : (
              <div className="user-menu">
                <div className="user-info">
                  <div className="user-details">
                    <span className="user-name">
                      Hello, <strong>{user.name}</strong>
                    </span>
                    <span className={`user-role ${user.role}`}>
                      {user.role}
                      {!user.is_verified && (
                        <span className="verification-badge">Unverified</span>
                      )}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header