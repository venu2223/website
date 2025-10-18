import { useState, useEffect } from 'react'

export const useHistory = (initialView = 'home') => {
  const [history, setHistory] = useState([initialView])
  const [currentIndex, setCurrentIndex] = useState(0)

  const push = (view) => {
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(view)
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      return history[currentIndex - 1]
    }
    return null
  }

  const goForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
      return history[currentIndex + 1]
    }
    return null
  }

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < history.length - 1

  return {
    currentView: history[currentIndex],
    push,
    goBack,
    goForward,
    canGoBack,
    canGoForward
  }
}