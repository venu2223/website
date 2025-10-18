import React from 'react'

const Home = ({ onShowView }) => {
  return (
    <div className="view">
      <div className="home-page">
        <div className="container">
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                Welcome to <span className="highlight">LearnHub LMS</span>
              </h1>
              <p className="hero-subtitle">
                Transform your learning experience with our interactive platform. 
                Join thousands of students and educators worldwide.
              </p>
              
              {/* Single Call-to-Action Section */}
              <div className="cta-section">
                <div className="cta-card">
                  <h2>Ready to Start Your Journey?</h2>
                  <p>Choose your path and join our learning community</p>
                  
                  <div className="cta-buttons">
                    <button 
                      className="btn btn-primary btn-lg cta-btn"
                      onClick={() => onShowView('register')}
                    >
                      <span className="btn-icon">🚀</span>
                      Get Started Free
                    </button>
                    
                    <div className="login-options">
                      <p>Already have an account?</p>
                      <button 
                        className="btn btn-outline"
                        onClick={() => onShowView('login')}
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Grid - Simplified */}
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">🎓</div>
                  <div className="feature-content">
                    <h3>For Students</h3>
                    <p>Access courses, track progress, and collaborate with peers in an engaging learning environment.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">👨‍🏫</div>
                  <div className="feature-content">
                    <h3>For Educators</h3>
                    <p>Create interactive courses, manage students, and provide meaningful feedback effortlessly.</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-content">
                    <h3>Fast & Reliable</h3>
                    <p>Built with modern technology for seamless performance and 99.9% uptime guarantee.</p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="stats-section">
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Learners</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Courses</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home