import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`🟡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject({
      type: 'REQUEST_ERROR',
      message: 'Failed to prepare request'
    })
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.log('🔴 API Error Interceptor:', {
      hasResponse: !!error.response,
      status: error.response?.status,
      data: error.response?.data
    })

    // Handle network errors (no response)
    if (!error.response) {
      return Promise.reject({
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to the server.',
        suggestion: 'Please check your internet connection and try again.'
      })
    }

    const { status, data } = error.response

    // For 401 errors - login-related errors
    if (status === 401) {
      console.log('🟡 401 Error detected:', data?.errorData?.type)
      
      // Check if this is a login-related error
      const isLoginError = data?.errorData?.type && [
        'ROLE_MISMATCH', 
        'INVALID_PASSWORD', 
        'NO_ACCOUNT'
      ].includes(data.errorData.type)
      
      if (isLoginError) {
        console.log('🟡 Returning login error to authService')
        // Return the structured error that authService expects
        return Promise.reject({
          type: data.errorData.type,
          message: data.errorData.message,
          suggestion: data.errorData.suggestion,
          ...data.errorData // Include all errorData properties
        })
      } else {
        // Session expiry handling
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('loginTime')
        
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login?session_expired=true'
        }
        
        return Promise.reject({
          type: 'UNAUTHORIZED',
          message: 'Your session has expired. Please log in again.'
        })
      }
    }
    
    // For 404 errors
    if (status === 404) {
      if (data?.errorData?.type && ['NO_ACCOUNT', 'USER_NOT_FOUND'].includes(data.errorData.type)) {
        return Promise.reject({
          type: data.errorData.type,
          message: data.errorData.message,
          suggestion: data.errorData.suggestion
        })
      } else {
        return Promise.reject({
          type: 'ENDPOINT_NOT_FOUND',
          message: 'Requested endpoint not found',
          url: error.config?.url
        })
      }
    }
    
    // For 500 errors
    if (status === 500) {
      return Promise.reject({
        type: 'SERVER_ERROR',
        message: 'Server error occurred'
      })
    }

    // For all other errors
    return Promise.reject(data || {
      type: 'API_ERROR',
      message: 'An unexpected error occurred'
    })
  }
)

export const testConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 })
    return { success: true, data: response.data }
  } catch (error) {
    return { 
      success: false, 
      error: {
        type: 'CONNECTION_TEST_FAILED',
        message: 'Cannot connect to backend server'
      }
    }
  }
}

export default api