import React, { useState } from 'react'
import { useLock } from '../contexts/LockContext'
import { useNotification } from '../contexts/NotificationContext'

const Lock = () => {
  const [password, setPassword] = useState('')
  const { unlock } = useLock()
  const { showNotification } = useNotification()

  const handleUnlock = (e) => {
    e.preventDefault()
    if (unlock(password)) {
      setPassword('')
    } else {
      showNotification('Incorrect password', 'error')
    }
  }

  return (
    <div className="w-[350px] h-[600px] bg-[#e6f7ef] text-gray-800 relative flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Wallet Locked
          </h2>
          <p className="text-sm text-gray-600">
            Enter your password to unlock
          </p>
        </div>

        <form onSubmit={handleUnlock} className="mt-8 space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#c5e7d7] rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#4caf8e] focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#4caf8e] text-white rounded-xl hover:bg-[#3d8b71] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4caf8e] focus:ring-offset-2"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}

export default Lock 