import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useLanguage } from './LanguageContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const { translate } = useLanguage()
  const notificationIdCounter = useRef(0)

  // Bildirimleri temizle
  const clearNotifications = useCallback(() => {
    try {
      setNotifications([])
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }, [])

  // Bildirimi kaldır
  const removeNotification = useCallback((id) => {
    try {
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (error) {
      console.error('Error removing notification:', error)
    }
  }, [])

  // Yeni bildirim göster
  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    try {
      const id = notificationIdCounter.current++
      
      // Bildirim objesi oluştur
      const notification = {
        id,
        message: typeof message === 'string' ? message : String(message),
        type,
        icon: type === 'success' ? '✓' 
          : type === 'error' ? '✕'
          : type === 'warning' ? '⚠'
          : 'ℹ',
        progress: 100
      }

      // Bildirimi ekle
      setNotifications(prev => [...prev, notification])

      // Progress bar animasyonu için interval
      const progressInterval = setInterval(() => {
        setNotifications(prev => 
          prev.map(n => 
            n.id === id 
              ? { ...n, progress: Math.max(0, n.progress - (100 / (duration / 100))) }
              : n
          )
        )
      }, 100)

      // Süre sonunda bildirimi kaldır
      setTimeout(() => {
        clearInterval(progressInterval)
        removeNotification(id)
      }, duration)

      return id
    } catch (error) {
      console.error('Error showing notification:', error)
      return null
    }
  }, [removeNotification])

  const value = {
    notifications,
    showNotification,
    clearNotifications,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 left-4 z-50 flex flex-col items-center space-y-2 pointer-events-none">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`w-full max-w-sm bg-white rounded-lg shadow-lg pointer-events-auto
              transform transition-all duration-300 hover:scale-102
              ${notification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          >
            <div className="relative overflow-hidden rounded-lg">
              {/* Progress bar */}
              <div 
                className={`absolute bottom-0 left-0 h-1 transition-all duration-100 ${
                  notification.type === 'success' ? 'bg-emerald-500'
                  : notification.type === 'error' ? 'bg-red-500'
                  : notification.type === 'warning' ? 'bg-yellow-500'
                  : 'bg-blue-500'
                }`}
                style={{ width: `${notification.progress}%` }}
              />

              <div className="p-4 flex items-start space-x-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-white text-sm
                  ${notification.type === 'success' ? 'bg-emerald-500'
                  : notification.type === 'error' ? 'bg-red-500'
                  : notification.type === 'warning' ? 'bg-yellow-500'
                  : 'bg-blue-500'}`}
                >
                  {notification.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-gray-800">{notification.message}</p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
} 