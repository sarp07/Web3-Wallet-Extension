import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const LockContext = createContext(null)

const DEFAULT_LOCK_TIMEOUT = 60 * 60 * 1000 // 1 saat default

// Aktivite güncellemesi tetikleyecek olaylar
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll']

export const LockProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLocked, setIsLocked] = useState(false)
  const [lastActivity, setLastActivity] = useState(() => Date.now())
  const [password, setPassword] = useState(null)
  const [lockTimeout, setLockTimeout] = useState(() => {
    try {
      const savedTimeout = localStorage.getItem('lockTimeout')
      return savedTimeout ? parseInt(savedTimeout) : DEFAULT_LOCK_TIMEOUT
    } catch (error) {
      console.error('Error loading lock timeout:', error)
      return DEFAULT_LOCK_TIMEOUT
    }
  })

  // Password'u localStorage'dan al
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('walletData')
      if (storedData) {
        const { password: storedPassword } = JSON.parse(storedData)
        setPassword(storedPassword)
        
        // İlk yükleme sırasında son aktivite zamanını güncelle
        const now = Date.now()
        setLastActivity(now)
        localStorage.setItem('lastActivity', now.toString())
      }
    } catch (error) {
      console.error('Error loading wallet data:', error)
    }
  }, [])

  // Aktivite güncelleme fonksiyonu
  const updateActivity = useCallback(() => {
    try {
      if (!isLocked) {
        const now = Date.now()
        setLastActivity(now)
        localStorage.setItem('lastActivity', now.toString())
      }
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }, [isLocked])

  // Aktivite takibi
  useEffect(() => {
    const handleActivity = () => updateActivity()

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [updateActivity])

  // Lock timeout kontrolü
  useEffect(() => {
    let checkInterval

    const checkLockStatus = () => {
      try {
        if (location.pathname === '/lock' || isLocked || !password) {
          return
        }

        const now = Date.now()
        const storedLastActivity = localStorage.getItem('lastActivity')
        const lastActivityTime = storedLastActivity ? parseInt(storedLastActivity) : lastActivity
        const timeSinceLastActivity = now - lastActivityTime

        if (timeSinceLastActivity >= lockTimeout) {
          setIsLocked(true)
          navigate('/lock')
        }
      } catch (error) {
        console.error('Error checking lock status:', error)
      }
    }

    if (!isLocked && password) {
      checkInterval = setInterval(checkLockStatus, 1000)
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [lastActivity, isLocked, password, lockTimeout, location.pathname, navigate])

  const lock = useCallback(() => {
    try {
      if (password && location.pathname !== '/lock') {
        setIsLocked(true)
        navigate('/lock')
      }
    } catch (error) {
      console.error('Error locking wallet:', error)
    }
  }, [password, location.pathname, navigate])

  const unlock = useCallback((enteredPassword) => {
    try {
      if (enteredPassword === password) {
        setIsLocked(false)
        updateActivity()
        navigate('/dashboard')
        return true
      }
      return false
    } catch (error) {
      console.error('Error unlocking wallet:', error)
      return false
    }
  }, [password, navigate, updateActivity])

  const updatePassword = useCallback((newPassword) => {
    try {
      setPassword(newPassword)
      const walletData = localStorage.getItem('walletData')
      if (walletData) {
        const data = JSON.parse(walletData)
        data.password = newPassword
        localStorage.setItem('walletData', JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error updating password:', error)
    }
  }, [])

  const updateLockTimeout = useCallback((minutes) => {
    try {
      const timeout = Math.floor(minutes * 60 * 1000)
      setLockTimeout(timeout)
      localStorage.setItem('lockTimeout', timeout.toString())
      updateActivity()
    } catch (error) {
      console.error('Error updating lock timeout:', error)
    }
  }, [updateActivity])

  const getLockTimeoutMinutes = useCallback(() => {
    try {
      return lockTimeout / (60 * 1000)
    } catch (error) {
      console.error('Error getting lock timeout minutes:', error)
      return DEFAULT_LOCK_TIMEOUT / (60 * 1000)
    }
  }, [lockTimeout])

  const resetLock = useCallback(() => {
    try {
      setIsLocked(false)
      setPassword(null)
      updateActivity()
    } catch (error) {
      console.error('Error resetting lock:', error)
    }
  }, [updateActivity])

  const value = {
    isLocked,
    lock,
    unlock,
    updatePassword,
    resetLock,
    lastActivity,
    updateLockTimeout,
    getLockTimeoutMinutes
  }

  return (
    <LockContext.Provider value={value}>
      {children}
    </LockContext.Provider>
  )
}

export const useLock = () => {
  const context = useContext(LockContext)
  if (!context) {
    throw new Error('useLock must be used within a LockProvider')
  }
  return context
} 