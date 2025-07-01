import { cn } from '@renderer/lib/utils'
import { ReactNode } from 'react'

interface Props {
  title?: string
  subtitle?: string
  header?: ReactNode
  children?: ReactNode
  className?: string
}

const BasePage: React.FC<Props> = ({ title, subtitle, header, children, className }) => {
  return (
    <div className={cn('enterprise-main h-full overflow-hidden', className)} style={{ color: '#1f2937' }}>
      {(title || subtitle || header) && (
        <div className="enterprise-page-header sticky top-0 z-10" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="enterprise-page-title" style={{ color: '#1f2937' }}>{title}</h1>
              )}
              {subtitle && (
                <p className="enterprise-page-subtitle" style={{ color: '#6b7280' }}>{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-4 app-nodrag">
              {header}
            </div>
          </div>
        </div>
      )}
      <div className="enterprise-content overflow-y-auto" style={{ color: '#1f2937' }}>
        {children}
      </div>
    </div>
  )
}

export default BasePage
