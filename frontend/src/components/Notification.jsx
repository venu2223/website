import React, { useEffect } from 'react'

const Notification = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 6000) // Increased to 6 seconds for better readability

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const renderMessage = () => {
    if (typeof message === 'string') {
      return message
    }
    return message
  }

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {renderMessage()}
      </div>
      <button onClick={onClose} className="notification-close">
        ×
      </button>
    </div>
  )
}

export default Notification