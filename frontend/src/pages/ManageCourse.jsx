import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { assignmentService } from '../services/assignmentService'
import { videoService } from '../services/videoService'
import CreateAssignmentModal from '../components/CreateAssignmentModal'
import GradeSubmissionModal from '../components/GradeSubmissionModal'
import AddContentModal from '../components/AddContentModal'
import VideoUploadModal from '../components/VideoUploadModal'

const ManageCourse = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [content, setContent] = useState([])
  const [assignments, setAssignments] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showAddContent, setShowAddContent] = useState(false)
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  
  // Assignment states
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [showGradeSubmission, setShowGradeSubmission] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [submissions, setSubmissions] = useState({})

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  const loadCourseData = async () => {
    try {
      console.log('Loading course data for ID:', courseId);
      
      const [courseResponse, enrollmentsResponse] = await Promise.all([
        courseService.getCourseDetails(courseId),
        courseService.getCourseEnrollments(courseId)
      ]);

      console.log('Course response:', courseResponse);
      console.log('Course content from API:', courseResponse.data.content);
      console.log('Setting content state with:', courseResponse.data.content || []);

      setCourse(courseResponse.data.course);
      setContent(courseResponse.data.content || []);
      setEnrollments(enrollmentsResponse.data.enrollments || []);
      
      // Try to get assignments, but don't fail if it doesn't exist yet
      try {
        const assignmentsResponse = await assignmentService.getCourseAssignments(courseId);
        setAssignments(assignmentsResponse.data.assignments || []);
      } catch (assignmentsError) {
        console.warn('Could not load assignments:', assignmentsError);
        setAssignments([]);
      }
      
    } catch (error) {
      console.error('Failed to load course data:', error);
      if (error.status === 404) {
        setCourse(null);
      } else {
        alert('Failed to load course data: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  // Add useEffect to debug content state changes
  useEffect(() => {
    console.log('Content state updated:', content);
    console.log('Content length:', content.length);
  }, [content]);

  const handleContentAdded = () => {
    loadCourseData()
    setShowAddContent(false)
  }

  const handleVideoAdded = () => {
    loadCourseData()
    setShowVideoUpload(false)
  }

  const handleAddContent = () => {
    setShowAddContent(true)
  }

  const handleUploadVideo = () => {
    setShowVideoUpload(true)
  }

  const handleCreateAssignment = () => {
    setShowCreateAssignment(true)
  }

  const handleAssignmentCreated = () => {
    loadCourseData()
    setShowCreateAssignment(false)
  }

  const handleViewSubmissions = async (assignmentId) => {
    try {
      const response = await assignmentService.getAssignmentSubmissions(assignmentId)
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: response.data.submissions
      }))
    } catch (error) {
      console.error('Failed to load submissions:', error)
      alert('Failed to load submissions')
    }
  }

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission)
    setShowGradeSubmission(true)
  }

  const handleGraded = () => {
    if (selectedSubmission) {
      handleViewSubmissions(selectedSubmission.assignment_id)
    }
    setShowGradeSubmission(false)
    setSelectedSubmission(null)
  }

  // Delete video content
  const handleDeleteVideo = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await videoService.deleteVideoContent(contentId);
      setContent(prev => prev.filter(item => item.id !== contentId));
      alert('Video deleted successfully!');
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video: ' + (error.message || 'Unknown error'));
    }
  }

  if (loading) {
    return (
      <div className="manage-course-page">
        <div className="container">
          <div className="loading-course">
            <div className="loading-spinner"></div>
            <p>Loading course data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="manage-course-page">
        <div className="container">
          <div className="error-state">
            <h2>Course not found</h2>
            <p>Unable to load the course management page.</p>
            <Link to="/teacher/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-course-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <nav className="breadcrumb">
              <Link to="/teacher/dashboard">Teacher Dashboard</Link>
              <span> / </span>
              <span>Manage Course</span>
            </nav>
            <h1>{course.title}</h1>
            <p>Manage your course content, assignments, and students</p>
          </div>
          
          <div className="header-actions">
            <Link to={`/courses/${courseId}`} className="btn btn-outline">
              View Course
            </Link>
            <div className="action-buttons-group">
              <button className="btn btn-secondary" onClick={handleUploadVideo}>
                📹 Upload Video
              </button>
              <button className="btn btn-primary" onClick={handleAddContent}>
                Add Content
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="course-stats-overview">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Content Items</h3>
              <div className="stat-number">{content.length}</div>
              <p>Videos, documents, and quizzes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎬</div>
            <div className="stat-content">
              <h3>Videos</h3>
              <div className="stat-number">
                {content.filter(item => item.content_type === 'video').length}
              </div>
              <p>Video lessons</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Enrolled Students</h3>
              <div className="stat-number">{enrollments.length}</div>
              <p>Active learners</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Assignments</h3>
              <div className="stat-number">{assignments.length}</div>
              <p>Total assignments</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="management-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Content ({content.length})
          </button>
          <button 
            className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Videos ({content.filter(item => item.content_type === 'video').length})
          </button>
          <button 
            className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            Assignments ({assignments.length})
          </button>
          <button 
            className={`tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Students ({enrollments.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <OverviewTab 
              course={course}
              content={content}
              assignments={assignments}
              enrollments={enrollments}
              onAddContent={handleAddContent}
              onUploadVideo={handleUploadVideo}
              onCreateAssignment={handleCreateAssignment}
            />
          )}

          {activeTab === 'content' && (
            <ContentTab 
              content={content}
              onAddContent={handleAddContent}
              onUploadVideo={handleUploadVideo}
              onDeleteVideo={handleDeleteVideo}
            />
          )}

          {activeTab === 'videos' && (
            <VideosTab 
              videos={content.filter(item => item.content_type === 'video')}
              onUploadVideo={handleUploadVideo}
              onDeleteVideo={handleDeleteVideo}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsTab 
              assignments={assignments}
              submissions={submissions}
              onCreateAssignment={handleCreateAssignment}
              onViewSubmissions={handleViewSubmissions}
              onGradeSubmission={handleGradeSubmission}
            />
          )}

          {activeTab === 'students' && (
            <StudentsTab 
              enrollments={enrollments}
            />
          )}
        </div>

        {/* Modals */}
        <CreateAssignmentModal
          courseId={courseId}
          isOpen={showCreateAssignment}
          onClose={() => setShowCreateAssignment(false)}
          onAssignmentCreated={handleAssignmentCreated}
        />

        <GradeSubmissionModal
          submission={selectedSubmission}
          assignment={assignments.find(a => a.id === selectedSubmission?.assignment_id)}
          isOpen={showGradeSubmission}
          onClose={() => setShowGradeSubmission(false)}
          onGraded={handleGraded}
        />

        <AddContentModal
          courseId={courseId}
          isOpen={showAddContent}
          onClose={() => setShowAddContent(false)}
          onContentAdded={handleContentAdded}
        />

        <VideoUploadModal
          courseId={courseId}
          isOpen={showVideoUpload}
          onClose={() => setShowVideoUpload(false)}
          onVideoAdded={handleVideoAdded}
        />
      </div>
    </div>
  )
}

// Tab Components
const OverviewTab = ({ course, content, assignments, enrollments, onAddContent, onUploadVideo, onCreateAssignment }) => {
  const videoCount = content.filter(item => item.content_type === 'video').length;
  
  return (
    <div className="overview-tab">
      <div className="overview-grid">
        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={onUploadVideo}>
              <span className="action-icon">🎬</span>
              <span className="action-text">Upload Video</span>
            </button>
            <button className="action-btn success" onClick={onAddContent}>
              <span className="action-icon">📚</span>
              <span className="action-text">Add Content</span>
            </button>
            <button className="action-btn info" onClick={onCreateAssignment}>
              <span className="action-icon">📝</span>
              <span className="action-text">Create Assignment</span>
            </button>
            <button className="action-btn warning">
              <span className="action-icon">👥</span>
              <span className="action-text">View Students</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {enrollments.length === 0 ? (
              <div className="empty-activity">
                <p>No recent student activity</p>
              </div>
            ) : (
              enrollments.slice(0, 5).map(enrollment => (
                <div key={enrollment.id} className="activity-item">
                  <div className="activity-avatar">
                    {enrollment.student_name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="activity-content">
                    <p>
                      <strong>{enrollment.student_name || 'Student'}</strong> enrolled in the course
                    </p>
                    <span className="activity-time">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Summary */}
        <div className="content-summary-card">
          <h3>Content Summary</h3>
          <div className="content-types">
            <div className="content-type-item video">
              <span className="type-icon">🎬</span>
              <div className="type-details">
                <span className="type-count">{videoCount} Videos</span>
                <span className="type-label">Cloudinary hosted</span>
              </div>
            </div>
            <div className="content-type-item">
              <span className="type-icon">📄</span>
              <div className="type-details">
                <span className="type-count">
                  {content.filter(item => item.content_type === 'document').length} Documents
                </span>
                <span className="type-label">PDFs & materials</span>
              </div>
            </div>
            <div className="content-type-item">
              <span className="type-icon">📝</span>
              <div className="type-details">
                <span className="type-count">
                  {content.filter(item => item.content_type === 'quiz').length} Quizzes
                </span>
                <span className="type-label">Assessments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Quick Stats */}
        {videoCount > 0 && (
          <div className="video-stats-card">
            <h3>Video Analytics</h3>
            <div className="video-stats">
              <div className="video-stat">
                <span className="stat-icon">📊</span>
                <div className="stat-details">
                  <span className="stat-value">{videoCount}</span>
                  <span className="stat-label">Total Videos</span>
                </div>
              </div>
              <div className="video-stat">
                <span className="stat-icon">⏱️</span>
                <div className="stat-details">
                  <span className="stat-value">
                    {Math.round(content
                      .filter(item => item.content_type === 'video')
                      .reduce((total, video) => total + (video.video_duration || 0), 0) / 60
                    )}
                  </span>
                  <span className="stat-label">Total Minutes</span>
                </div>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={onUploadVideo}>
              Upload More Videos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const ContentTab = ({ content, onAddContent, onUploadVideo, onDeleteVideo }) => {
  console.log('ContentTab rendering with content:', content);
  console.log('ContentTab content length:', content.length);
  
  return (
    <div className="content-tab">
      <div className="tab-header">
        <h3>Course Content</h3>
        <div className="content-action-buttons">
          <button className="btn btn-secondary" onClick={onUploadVideo}>
            📹 Upload Video
          </button>
          <button className="btn btn-primary" onClick={onAddContent}>
            Add Other Content
          </button>
        </div>
      </div>

      {content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h4>No content yet</h4>
          <p>Start building your course by adding learning materials.</p>
          <div className="empty-state-actions">
            <button className="btn btn-primary" onClick={onUploadVideo}>
              📹 Upload Video
            </button>
            <button className="btn btn-outline" onClick={onAddContent}>
              Add Other Content
            </button>
          </div>
        </div>
      ) : (
        <div className="content-list">
          {content.map((item, index) => (
            <ContentItem 
              key={item.id} 
              item={item} 
              index={index} 
              onDeleteVideo={onDeleteVideo}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const VideosTab = ({ videos, onUploadVideo, onDeleteVideo }) => {
  console.log('VideosTab rendering with videos:', videos);
  console.log('VideosTab videos length:', videos.length);
  
  return (
    <div className="videos-tab">
      <div className="tab-header">
        <h3>Course Videos ({videos.length})</h3>
        <button className="btn btn-primary" onClick={onUploadVideo}>
          📹 Upload New Video
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h4>No videos yet</h4>
          <p>Upload video content to enhance your course with engaging multimedia lessons.</p>
          <button className="btn btn-primary" onClick={onUploadVideo}>
            Upload Your First Video
          </button>
        </div>
      ) : (
        <div className="videos-grid">
          {videos.map((video, index) => (
            <VideoItem 
              key={video.id} 
              video={video} 
              index={index}
              onDeleteVideo={onDeleteVideo}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const ContentItem = ({ item, index, onDeleteVideo }) => {
  console.log('ContentItem rendering:', item);
  
  const getTypeIcon = () => {
    switch (item.content_type) {
      case 'video': return '🎬'
      case 'document': return '📄'
      case 'quiz': return '📝'
      default: return '📚'
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="content-item">
      <div className="content-order">{index + 1}</div>
      <div className="content-icon">{getTypeIcon()}</div>
      <div className="content-details">
        <h4>{item.title}</h4>
        <p>{item.description || 'No description'}</p>
        <div className="content-meta">
          <span className="content-type">{item.content_type}</span>
          {item.content_type === 'video' && item.video_duration > 0 && (
            <span className="content-duration">{formatDuration(item.video_duration)}</span>
          )}
          {item.content_type === 'video' && item.video_url && (
            <span className="content-source">🔗 Cloudinary</span>
          )}
        </div>
      </div>
      <div className="content-actions">
        <button className="btn btn-outline btn-sm">Edit</button>
        {item.content_type === 'video' ? (
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => onDeleteVideo(item.id)}
          >
            Delete
          </button>
        ) : (
          <button className="btn btn-outline btn-sm">Delete</button>
        )}
      </div>
    </div>
  )
}

const VideoItem = ({ video, index, onDeleteVideo }) => {
  console.log('VideoItem rendering:', video);
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const handlePreview = () => {
    window.open(video.video_url, '_blank');
  }

  return (
    <div className="video-item">
      <div className="video-thumbnail">
        <div className="video-thumbnail-placeholder">
          <span className="video-icon">🎬</span>
          <div className="video-duration">{formatDuration(video.video_duration)}</div>
        </div>
      </div>
      <div className="video-details">
        <h4>{video.title}</h4>
        <p>{video.description || 'No description provided'}</p>
        <div className="video-meta">
          <span className="video-info">Duration: {formatDuration(video.video_duration)}</span>
          <span className="video-info">Order: {index + 1}</span>
          <span className="video-source">☁️ Cloudinary</span>
        </div>
        <div className="video-actions">
          <button className="btn btn-outline btn-sm" onClick={handlePreview}>
            Preview
          </button>
          <button className="btn btn-outline btn-sm">
            Edit
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => onDeleteVideo(video.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const AssignmentsTab = ({ assignments, submissions, onCreateAssignment, onViewSubmissions, onGradeSubmission }) => {
  return (
    <div className="assignments-tab">
      <div className="tab-header">
        <h3>Course Assignments</h3>
        <button className="btn btn-primary" onClick={onCreateAssignment}>
          Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h4>No assignments yet</h4>
          <p>Create assignments to assess student learning.</p>
          <button className="btn btn-primary" onClick={onCreateAssignment}>
            Create First Assignment
          </button>
        </div>
      ) : (
        <div className="assignments-list">
          {assignments.map(assignment => (
            <AssignmentItem 
              key={assignment.id} 
              assignment={assignment}
              submissions={submissions[assignment.id] || []}
              onViewSubmissions={onViewSubmissions}
              onGradeSubmission={onGradeSubmission}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const AssignmentItem = ({ assignment, submissions, onViewSubmissions, onGradeSubmission }) => {
  const isOverdue = new Date(assignment.due_date) < new Date()
  const assignmentSubmissions = submissions || []
  
  return (
    <div className={`assignment-item ${isOverdue ? 'overdue' : ''}`}>
      <div className="assignment-header">
        <h4>{assignment.title}</h4>
        <div className="assignment-meta">
          <span className="assignment-type">{assignment.assignment_type}</span>
          <span className="assignment-points">{assignment.max_points} points</span>
        </div>
      </div>
      
      <p className="assignment-description">
        {assignment.description || 'No description provided'}
      </p>
      
      <div className="assignment-footer">
        <div className="due-date">
          <strong>Due:</strong> {new Date(assignment.due_date).toLocaleDateString()}
          {assignmentSubmissions.length > 0 && (
            <span className="submission-count">
              • {assignmentSubmissions.length} submissions
            </span>
          )}
        </div>
        <div className="assignment-actions">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onViewSubmissions(assignment.id)}
          >
            View Submissions ({assignmentSubmissions.length})
          </button>
          <button className="btn btn-outline btn-sm">Edit</button>
        </div>
      </div>

      {/* Submissions List */}
      {assignmentSubmissions.length > 0 && (
        <div className="submissions-list">
          <h5>Submissions:</h5>
          {assignmentSubmissions.map(submission => (
            <div key={submission.id} className="submission-item">
              <div className="submission-info">
                <span className="student-name">{submission.student_name}</span>
                <span className="submission-date">
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </span>
                {submission.grade !== null ? (
                  <span className="grade-badge">
                    Grade: {submission.grade}/{assignment.max_points}
                  </span>
                ) : (
                  <span className="status-badge pending">Pending</span>
                )}
              </div>
              <div className="submission-actions">
                <button 
                  className="btn btn-outline btn-xs"
                  onClick={() => onGradeSubmission(submission)}
                >
                  {submission.grade !== null ? 'Regrade' : 'Grade'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const StudentsTab = ({ enrollments }) => {
  return (
    <div className="students-tab">
      <div className="tab-header">
        <h3>Enrolled Students ({enrollments.length})</h3>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h4>No students enrolled yet</h4>
          <p>Students will appear here once they enroll in your course.</p>
        </div>
      ) : (
        <div className="students-list">
          <div className="students-table">
            <div className="table-header">
              <div className="col-name">Student Name</div>
              <div className="col-email">Email</div>
              <div className="col-date">Enrollment Date</div>
              <div className="col-progress">Progress</div>
              <div className="col-actions">Actions</div>
            </div>
            
            {enrollments.map(enrollment => (
              <div key={enrollment.id} className="table-row">
                <div className="col-name">
                  <div className="student-avatar">
                    {enrollment.student_name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  {enrollment.student_name || 'Student'}
                </div>
                <div className="col-email">{enrollment.student_email || 'No email'}</div>
                <div className="col-date">
                  {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </div>
                <div className="col-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span>0%</span>
                </div>
                <div className="col-actions">
                  <button className="btn btn-outline btn-sm">View Progress</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageCourse