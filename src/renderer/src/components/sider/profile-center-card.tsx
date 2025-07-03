import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { User } from 'lucide-react'
import { useAuth } from '@renderer/hooks/use-auth'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from 'react-i18next'
import SidebarNavItem from '@renderer/components/sidebar/sidebar-nav-item'

interface Props {
  iconOnly?: boolean
}

const ProfileCenterCard: React.FC<Props> = ({ iconOnly = false }) => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { appConfig } = useAppConfig()
  const { profilecenterCardStatus = 'col-span-1' } = appConfig || {}
  
  // 额外检查是否有token（因为API登录成功）
  const hasToken = sessionStorage.getItem('mihomo-party-token')
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'profileCenter'
  })
  
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null
  
  if (!isAuthenticated || !hasToken || profilecenterCardStatus === 'hidden') {
    return null
  }

  return (
    <div
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 'calc(infinity)' : undefined
      }}
      className={`${profilecenterCardStatus} profile-center-card ${isDragging ? 'opacity-50' : ''}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <SidebarNavItem
        icon={<User className="w-5 h-5" />}
        label={t('sider.cards.profilecenter')}
        path="/profile-center"
        iconOnly={iconOnly}
        className={isDragging ? 'scale-[0.97]' : ''}
      />
    </div>
  )
}

export default ProfileCenterCard