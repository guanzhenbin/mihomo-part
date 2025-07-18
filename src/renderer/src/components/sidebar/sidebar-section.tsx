import React from 'react'

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`mb-8 w-full max-w-full overflow-hidden ${className}`}>
      <div className="px-4 mb-3">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
          {title}
        </h3>
      </div>
      <div className="space-y-1 w-full max-w-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default SidebarSection