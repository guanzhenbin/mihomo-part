import { MdDownload } from 'react-icons/md'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SidebarNavItem from '@renderer/components/sidebar/sidebar-nav-item'
import React from 'react'

interface Props {
  iconOnly?: boolean
}

const DownloadCard: React.FC<Props> = ({ iconOnly = false }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname.includes('/download')
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'download'
  })
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null

  return (
    <div
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 'calc(infinity)' : undefined
      }}
      className={`${isDragging ? 'opacity-50' : ''}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <SidebarNavItem
        icon={<MdDownload className="w-5 h-5" />}
        label={t('sider.download.title')}
        path="/download"
        isActive={isActive}
        iconOnly={iconOnly}
        className={isDragging ? 'scale-[0.97]' : ''}
      />
    </div>
  )
}

export default DownloadCard