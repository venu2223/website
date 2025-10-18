import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { useAuth } from '../contexts/AuthContext'

const CoursePlayer = () => {
  const { courseId, contentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [course, setCourse] = useState(null)
  const [content, setContent] = useState([])
  const [currentContent, setCurrentContent] = useState(null)
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (user?.role !== 'student') {
      navigate('/dashboard')
      return
    }
    loadCourseData()
  }, [courseId, user])

  useEffect(() => {
    if (content.length > 0) {
      const targetContent = contentId 
        ? content.find(item => item.id === parseInt(contentId))
        : content[0]
      setCurrentContent(targetContent || content[0])
    }
  }, [contentId, content])

  const loadCourseData = async () => {
    try {
      const [courseResponse, progressResponse] = await Promise.all([
        courseService.getCourseDetails(courseId),
        courseService.getStudentProgress()
      ])

      setCourse(courseResponse.data.course)
      setContent(courseResponse.data.content)
      setProgress(progressResponse.data.progress || [])
    } catch (error) {
      console.error('Failed to load course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (progressData) => {
    if (!currentContent) return
    
    try {
      await courseService.updateProgress(courseId, currentContent.id, {
        progress_percentage: progressData.progress,
        last_position: progressData.currentTime,
        total_time_watched: progressData.totalWatched
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleVideoProgress = (event) => {
    if (!event.target.duration) return
    
    const currentTime = event.target.currentTime
    const duration = event.target.duration
    const progress = (currentTime / duration) * 100
    
    setVideoProgress(progress)
    
    // Update progress every 10 seconds or when significant progress is made
    if (progress % 10 === 0 || progress >= 95) {
      updateProgress({
        progress: Math.min(95, Math.round(progress)), // Cap at 95% until completed
        currentTime: Math.round(currentTime),
        totalWatched: Math.round(currentTime)
      })
    }
  }

  const markAsCompleted = async () => {
    if (!currentContent) return
    
    try {
      await courseService.updateProgress(courseId, currentContent.id, {
        progress_percentage: 100,
        last_position: 0,
        total_time_watched: 300 // 5 minutes default
      })
      
      // Move to next content if available
      const currentIndex = content.findIndex(item => item.id === currentContent.id)
      if (currentIndex < content.length - 1) {
        const nextContent = content[currentIndex + 1]
        navigate(`/learn/${courseId}/${nextContent.id}`)
      }
      
      loadCourseData() // Refresh progress
    } catch (error) {
      console.error('Failed to mark as completed:', error)
    }
  }

  const getContentProgress = (contentId) => {
    const contentProgress = progress.find(p => p.content_id === contentId)
    return contentProgress?.progress_percentage || 0
  }

  const getCourseProgress = () => {
    const courseProgress = progress.find(p => p.course_id === parseInt(courseId))
    return courseProgress?.overall_progress || 0
  }

  if (loading) {
    return (
      <div className="course-player-page">
        <div className="container">
          <div className="loading-player">
            <div className="loading-spinner"></div>
            <p>Loading course content...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="course-player-page">
        <div className="container">
          <div className="error-state">
            <h2>Course not found</h2>
            <p>Unable to load the course content.</p>
            <Link to="/my-courses" className="btn btn-primary">
              Back to My Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="course-player-page">
      <div className="player-container">
        {/* Sidebar - Curriculum */}
        <div className="player-sidebar">
          <div className="sidebar-header">
            <Link to={`/courses/${courseId}`} className="back-link">
              ← Back to Course
            </Link>
            <h3>{course.title}</h3>
            <div className="course-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getCourseProgress()}%` }}
                ></div>
              </div>
              <span>{Math.round(getCourseProgress())}% complete</span>
            </div>
          </div>

          <div className="curriculum-list">
            {content.map((item, index) => (
              <CurriculumItem
                key={item.id}
                item={item}
                index={index}
                isActive={currentContent?.id === item.id}
                progress={getContentProgress(item.id)}
                onSelect={() => navigate(`/learn/${courseId}/${item.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="player-main">
          {currentContent ? (
            <>
              {/* Video/Content Player */}
              <div className="content-player">
                <div className="player-header">
                  <h1>{currentContent.title}</h1>
                  <div className="content-meta">
                    <span className="content-type">{currentContent.content_type}</span>
                    {currentContent.duration > 0 && (
                      <span className="content-duration">{currentContent.duration} min</span>
                    )}
                  </div>
                </div>

                <div className="player-area">
                  {currentContent.content_type === 'video' && currentContent.video_url ? (
                    <div className="video-container">
                      <video
                        controls
                        className="video-player"
                        onTimeUpdate={handleVideoProgress}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={markAsCompleted}
                      >
                        <source src={currentContent.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      
                      <div className="video-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${videoProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : currentContent.content_type === 'document' && currentContent.document_url ? (
                    <div className="document-container">
                      <div className="document-placeholder">
                        <span className="doc-icon">📄</span>
                        <h3>Document: {currentContent.title}</h3>
                        <p>This is a document resource for your learning.</p>
                        <a 
                          href={currentContent.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          Download Document
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="content-placeholder">
                      <span className="content-icon">
                        {currentContent.content_type === 'quiz' ? '📝' : '📚'}
                      </span>
                      <h3>{currentContent.title}</h3>
                      <p>{currentContent.description || 'Content coming soon...'}</p>
                    </div>
                  )}
                </div>

                {/* Content Description */}
                <div className="content-description">
                  <h3>About this {currentContent.content_type}</h3>
                  <p>{currentContent.description || 'No description available.'}</p>
                </div>

                {/* Navigation Buttons */}
                <div className="content-navigation">
                  <div className="nav-buttons">
                    {content.findIndex(item => item.id === currentContent.id) > 0 && (
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          const currentIndex = content.findIndex(item => item.id === currentContent.id)
                          const prevContent = content[currentIndex - 1]
                          navigate(`/learn/${courseId}/${prevContent.id}`)
                        }}
                      >
                        ← Previous
                      </button>
                    )}
                    
                    <button
                      className="btn btn-primary"
                      onClick={markAsCompleted}
                      disabled={getContentProgress(currentContent.id) === 100}
                    >
                      {getContentProgress(currentContent.id) === 100 ? 'Completed ✓' : 'Mark as Complete'}
                    </button>

                    {content.findIndex(item => item.id === currentContent.id) < content.length - 1 && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const currentIndex = content.findIndex(item => item.id === currentContent.id)
                          const nextContent = content[currentIndex + 1]
                          navigate(`/learn/${courseId}/${nextContent.id}`)
                        }}
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-content">
              <h2>No content available</h2>
              <p>This course doesn't have any content yet.</p>
              <Link to="/my-courses" className="btn btn-primary">
                Back to My Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CurriculumItem = ({ item, index, isActive, progress, onSelect }) => {
  const getItemIcon = () => {
    switch (item.content_type) {
      case 'video': return '🎬'
      case 'document': return '📄'
      case 'quiz': return '📝'
      default: return '📚'
    }
  }

  const getProgressColor = () => {
    if (progress === 100) return 'completed'
    if (progress > 0) return 'in-progress'
    return 'not-started'
  }

  return (
    <div 
      className={`curriculum-item ${isActive ? 'active' : ''} ${getProgressColor()}`}
      onClick={onSelect}
    >
      <div className="item-icon">{getItemIcon()}</div>
      
      <div className="item-content">
        <div className="item-header">
          <h4>{item.title}</h4>
          <div className="item-meta">
            {item.duration > 0 && (
              <span className="duration">{item.duration}m</span>
            )}
          </div>
        </div>
        
        <p className="item-description">
          {item.description || 'No description'}
        </p>
        
        {progress > 0 && (
          <div className="item-progress">
            <div className="progress-bar small">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progress}%</span>
          </div>
        )}
      </div>
      
      <div className="item-status">
        {progress === 100 && <span className="status-completed">✓</span>}
        {progress > 0 && progress < 100 && <span className="status-in-progress">⟳</span>}
        {progress === 0 && <span className="status-not-started">○</span>}
      </div>
    </div>
  )
}

export default CoursePlayer