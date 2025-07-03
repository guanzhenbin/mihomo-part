import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tooltip } from '@heroui/react'

interface SidebarNavItemProps {
  icon: React.ReactNode
  label: string
  path: string
  isActive?: boolean
  iconOnly?: boolean
  className?: string
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ 
  icon, 
  label, 
  path, 
  isActive = false, 
  iconOnly = false,
  className = '' 
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const active = isActive || location.pathname.includes(path)

  if (iconOnly) {
    return (
      <div className="flex justify-center">
        <Tooltip content={label} placement="right">
          <button
            onClick={() => navigate(path)}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              active
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
            } ${className}`}
          >
            {icon}
          </button>
        </Tooltip>
      </div>
    )
  }

  return (
    <button
      onClick={() => navigate(path)}
      className={`group relative w-full px-3 py-2.5 mx-3 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-primary text-white shadow-lg shadow-primary/25'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-200'
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 flex items-center justify-center ${
          active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
        }`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${
          active ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
        }`}>
          {label}
        </span>
      </div>
    </button>
  )
}

export default SidebarNavItem