import { Button } from '@heroui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import React from 'react'

interface MenuItemProps {
  icon: React.ReactNode
  title: string
  path: string
  badge?: string | number
  count?: number
  isActive?: boolean
  onClick?: () => void
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  path, 
  badge, 
  count,
  isActive,
  onClick 
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const match = isActive ?? location.pathname.includes(path)

  const handleClick = (): void => {
    if (onClick) {
      onClick()
    } else {
      navigate(path)
    }
  }

  return (
    <Button
      fullWidth
      className={`justify-start h-10 px-4 enterprise-menu-item ${match ? 'active' : ''}`}
      variant="light"
      onPress={handleClick}
      startContent={
        <span className={`icon text-[18px]`}>
          {icon}
        </span>
      }
      endContent={
        (badge || count !== undefined) && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${match ? 'bg-white/25 text-white shadow-sm' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
            {badge || count}
          </span>
        )
      }
    >
      <span className="text-sm font-medium flex-1 text-left">
        {title}
      </span>
    </Button>
  )
}

export default MenuItem 