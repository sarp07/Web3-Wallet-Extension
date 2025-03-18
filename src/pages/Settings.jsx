import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLock } from '../contexts/LockContext'
import { showNotification } from '../utils/notification'

const Settings = () => {
  const { t: translate } = useTranslation()
  const { updateLockTimeout } = useLock()
  const [selectedTimeout, setSelectedTimeout] = useState(() => {
    const savedTimeout = localStorage.getItem('lockTimeout')
    return savedTimeout ? parseInt(savedTimeout) / (60 * 1000) : 60 // 60 dakika default
  })

  const handleLockTimeoutChange = (value) => {
    try {
      const minutes = parseFloat(value)
      setSelectedTimeout(minutes)
      updateLockTimeout(minutes)
      showNotification(translate('notifications.autoLockTimeoutUpdated'), 'success')
      console.log(`Otomatik kilit süresi ${minutes} dakika olarak ayarlandı`)
    } catch (error) {
      console.error('Otomatik kilit süresi güncellenirken hata:', error)
      showNotification(translate('notifications.error'), 'error')
    }
  }

  return (
    <div>
      {/* Render your component content here */}
    </div>
  )
}

export default Settings 