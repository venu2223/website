import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Notification from './components/Notification'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CourseCatalog from './pages/CourseCatalog'
import CourseDetail from './pages/CourseDetail'
import CoursePlayer from './pages/CoursePlayer'
import MyCourses from './pages/MyCourses'
import TeacherDashboard from './pages/TeacherDashboard'
import CreateCourse from './pages/CreateCourse'
import ManageCourse from './pages/ManageCourse'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

const AppContent = () => {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          
          {/* Protected Routes - All Users */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/my-courses" element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          } />
          
          <Route path="/learn/:courseId/:contentId?" element={
            <ProtectedRoute>
              <CoursePlayer />
            </ProtectedRoute>
          } />
          
          {/* Teacher Only Routes */}
          <Route path="/teacher/dashboard" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/teacher/courses/create" element={
            <ProtectedRoute requiredRole="teacher">
              <CreateCourse />
            </ProtectedRoute>
          } />
          
          <Route path="/teacher/courses/:courseId/manage" element={
            <ProtectedRoute requiredRole="teacher">
              <ManageCourse />
            </ProtectedRoute>
          } />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Notification />
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App