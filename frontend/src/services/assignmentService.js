import api from './api'

export const assignmentService = {
  // Create assignment (teacher only)
  async createAssignment(courseId, assignmentData) {
    const response = await api.post(`/courses/${courseId}/assignments`, assignmentData)
    return response.data
  },

  // Get course assignments
  async getCourseAssignments(courseId) {
    const response = await api.get(`/courses/${courseId}/assignments`)
    return response.data
  },

  // Submit assignment
  async submitAssignment(assignmentId, submissionData) {
    const formData = new FormData()
    Object.keys(submissionData).forEach(key => {
      formData.append(key, submissionData[key])
    })
    
    const response = await api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Get student submissions - FIXED ENDPOINT
  async getStudentSubmissions() {
    const response = await api.get('/students/submissions')
    return response.data
  },

  // Grade submission (teacher only)
  async gradeSubmission(submissionId, gradeData) {
    const response = await api.post(`/submissions/${submissionId}/grade`, gradeData)
    return response.data
  },

  // Get student grades - FIXED ENDPOINT
  async getStudentGrades() {
    const response = await api.get('/students/grades')
    return response.data
  }
}