import React, { useState } from 'react'
import { cn } from '@heroui/react'
import { FaShieldAlt, FaLock, FaUnlock } from 'react-icons/fa'
import { HiLockClosed, HiLockOpen } from 'react-icons/hi'
import './vpn-switch.css'

interface VpnSwitchProps {
  isSelected?: boolean
  onValueChange?: (value: boolean) => void
  isDisabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const VpnSwitch: React.FC<VpnSwitchProps> = ({
  isSelected = false,
  onValueChange,
  isDisabled = false,
  size = 'md',
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleToggle = () => {
    if (!isDisabled && onValueChange) {
      onValueChange(!isSelected)
    }
  }

  const sizeClasses = {
    sm: 'w-14 h-7',
    md: 'w-20 h-10',
    lg: 'w-24 h-12'
  }

  const thumbSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const iconSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  }

  return (
    <div className="relative">
      {/* Outer glow ring */}
      {isSelected && (
        <div className={cn(
          'absolute inset-0 rounded-full animate-pulse',
          sizeClasses[size],
          'bg-gradient-to-r from-emerald-400/30 via-green-400/30 to-teal-400/30 blur-lg'
        )} />
      )}
      
      <button
        className={cn(
          'relative inline-flex items-center rounded-full transition-all duration-500 ease-out focus:outline-none group overflow-hidden',
          sizeClasses[size],
          {
            // Active state - beautiful gradient with glow
            'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-xl': isSelected,
            'shadow-green-500/40': isSelected,
            
            // Inactive state - subtle gradient
            'bg-gradient-to-r from-slate-200 via-gray-200 to-slate-300': !isSelected,
            'dark:from-slate-700 dark:via-gray-700 dark:to-slate-600': !isSelected,
            'shadow-md shadow-gray-300/50 dark:shadow-gray-800/50': !isSelected,
            
            'opacity-50 cursor-not-allowed': isDisabled,
            'cursor-pointer': !isDisabled,
            'scale-[0.98]': isPressed && !isDisabled,
            'scale-105': isHovered && isSelected && !isDisabled
          },
          className
        )}
        onClick={handleToggle}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsPressed(false)
          setIsHovered(false)
        }}
        disabled={isDisabled}
        aria-checked={isSelected}
        role="switch"
      >
        {/* Shimmer effect when active */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full animate-shimmer"
               style={{
                 background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
               }} />
        )}
        
        {/* Track decoration */}
        <div className="absolute inset-0 rounded-full">
          {/* Active decoration */}
          {isSelected && (
            <div className="absolute inset-1 rounded-full bg-white/10 backdrop-blur-sm" />
          )}
          
          {/* Connection waves when active */}
          {isSelected && (
            <>
              <div className="absolute top-1/2 left-3 w-1 h-1 bg-white/60 rounded-full animate-ping" 
                   style={{ animationDelay: '0ms', animationDuration: '1.5s' }} />
              <div className="absolute top-1/2 left-5 w-1 h-1 bg-white/40 rounded-full animate-ping" 
                   style={{ animationDelay: '300ms', animationDuration: '1.5s' }} />
              <div className="absolute top-1/2 left-7 w-1 h-1 bg-white/20 rounded-full animate-ping" 
                   style={{ animationDelay: '600ms', animationDuration: '1.5s' }} />
            </>
          )}
        </div>
        
        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1 rounded-full transition-all duration-500 ease-out flex items-center justify-center z-10',
            thumbSizeClasses[size],
            {
              'left-1': !isSelected,
              'left-full -translate-x-full mr-1': isSelected,
              // Thumb styling
              'bg-white shadow-xl': true,
              'shadow-black/20': !isSelected,
              'shadow-green-900/30': isSelected,
            }
          )}
        >
          {/* Thumb inner glow */}
          <div className={cn(
            'absolute inset-0 rounded-full transition-all duration-500',
            {
              'bg-gradient-to-br from-green-400/20 to-emerald-500/20': isSelected,
              'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-300 dark:to-gray-100': !isSelected
            }
          )} />
          
          {/* Icon */}
          <div className={cn('relative transition-all duration-300 transform', iconSizeClasses[size], {
            'text-green-600 scale-110': isSelected,
            'text-gray-500 dark:text-gray-600': !isSelected,
            'rotate-12': isSelected && isHovered
          })}>
            {isSelected ? (
              <FaShieldAlt className="drop-shadow-sm" />
            ) : (
              <HiLockOpen className="drop-shadow-sm" />
            )}
          </div>
        </div>

        {/* Status text inside track */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={cn(
            'text-xs font-bold tracking-wider transition-all duration-300',
            {
              'text-white/80 opacity-100': isSelected,
              'text-gray-600 dark:text-gray-400 opacity-0': !isSelected
            }
          )}>
            {size === 'lg' && isSelected && 'SECURE'}
          </span>
        </div>
      </button>
      
    </div>
  )
}

export default VpnSwitch