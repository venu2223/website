import React, { useState, useEffect } from 'react'
import { assignmentService } from '../services/assignmentService'
import { useAuth } from '../contexts/AuthContext'
import SubmitAssignmentModal from '../components/SubmitAssignmentModal'

const StudentAssignments = () => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const response = await assignmentService.getStudentSubmissions()
      setSubmissions(response.data.submissions)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment)
    setShowSubmitModal(true)
  }

  const handleSubmissionCreated = () => {
    loadSubmissions()
    setShowSubmitModal(false)
    setSelectedAssignment(null)
  }

  const getStatusInfo = (submission, dueDate) => {
    const now = new Date()
    const due = new Date(dueDate)
    
    if (submission) {
      if (submission.grade !== null) {
        return { status: 'graded', label: 'Graded', color: 'success' }
      }
      return { status: 'submitted', label: 'Submitted', color: 'info' }
    }
    
    if (now > due) {
      return { status: 'overdue', label: 'Overdue', color: 'error' }
    }
    
    return { status: 'pending', label: 'Pending', color: 'warning' }
  }

  if (loading) {
    return (
      <div className="student-assignments-page">
        <div className="container">
          <div className="loading-assignments">
            <div className="loading-spinner"></div>
            <p>Loading your assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  // Group submissions by course
  const assignmentsByCourse = submissions.reduce((acc, submission) => {
    const courseTitle = submission.course_title
    if (!acc[courseTitle]) {
      acc[courseTitle] = []
    }
    acc[courseTitle].push(submission)
    return acc
  }, {})

  return (
    <div className="student-assignments-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>My Assignments</h1>
            <p>Track your assignment submissions and grades</p>
          </div>
        </div>

        {Object.keys(assignmentsByCourse).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No assignments yet</h3>
            <p>You don't have any assignments to submit at the moment.</p>
          </div>
        ) : (
          <div className="assignments-by-course">
            {Object.entries(assignmentsByCourse).map(([courseTitle, courseSubmissions]) => (
              <div key={courseTitle} className="course-assignments">
                <h2 className="course-title">{courseTitle}</h2>
                <div className="assignments-list">
                  {courseSubmissions.map(submission => {
                    const statusInfo = getStatusInfo(submission, submission.due_date)
                    
                    return (
                      <div key={submission.id} className={`assignment-card ${statusInfo.status}`}>
                        <div className="assignment-header">
                          <h3>{submission.assignment_title}</h3>
                          <span className={`status-badge ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="assignment-details">
                          <p><strong>Teacher:</strong> {submission.teacher_name}</p>
                          <p><strong>Due Date:</strong> {new Date(submission.due_date).toLocaleString()}</p>
                          <p><strong>Max Points:</strong> {submission.max_points}</p>
                          
                          {submission.grade !== null && (
                            <p><strong>Your Grade:</strong> 
                              <span className="grade"> {submission.grade}/{submission.max_points}</span>
                            </p>
                          )}
                          
                          {submission.feedback && (
                            <div className="feedback">
                              <strong>Feedback:</strong>
                              <p>{submission.feedback}</p>
                            </div>
                          )}
                        </div>

                        <div className="assignment-actions">
                          {!submission && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSubmitAssignment({
                                id: submission.assignment_id,
                                title: submission.assignment_title,
                                due_date: submission.due_date,
                                max_points: submission.max_points
                              })}
                            >
                              Submit Assignment
                            </button>
                          )}
                          
                          {submission && (
                            <div className="submission-info">
                              <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                              {submission.file_url && (
                                <a 
                                  href={submission.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-outline btn-sm"
                                >
                                  Download Submission
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <SubmitAssignmentModal
          assignment={selectedAssignment}
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmissionCreated={handleSubmissionCreated}
        />
      </div>
    </div>
  )
}

export default StudentAssignments