
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

const BottomBar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate()
  const { translate } = useLanguage()

  return (
    <div className="flex-none absolute bottom-0 left-0 right-0 flex justify-around items-center px-4 pt-1 border-t border-[#c5e7d7] bg-white/80 backdrop-blur-sm">
      {[
        { icon: '○', label: 'assets', action: () => setActiveTab('tokens') },
        { 
          icon: '🔗', 
          label: 'connect',
          action: () => navigate('/connect')
        },
        { icon: '⚙️', label: 'settings', action: () => navigate('/settings') }
      ].map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          className={`flex flex-col items-center group ${
            activeTab === (item.label === 'assets' ? 'tokens' : item.label)
              ? 'text-[#4caf8e]'
              : 'text-gray-400'
          }`}
        >
          <span className="text-lg group-hover:text-[#4caf8e] transition-colors">
            {item.icon}
          </span>
          <span className="text-[10px] group-hover:text-[#4caf8e] transition-colors">
            {translate(`dashboard.${item.label}`)}
          </span>
        </button>
      ))}
    </div>
  )
}

export default BottomBar 