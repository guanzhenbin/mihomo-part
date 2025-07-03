import { Card, CardBody, Button, Tooltip } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { User } from 'lucide-react'
import { useAuth } from '@renderer/hooks/use-auth'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from 'react-i18next'

interface Props {
  iconOnly?: boolean
}

const ProfileCenterCard: React.FC<Props> = ({ iconOnly = false }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { appConfig } = useAppConfig()
  const { profilecenterCardStatus = 'col-span-1' } = appConfig || {}
  const match = location.pathname.includes('/profile-center')
  
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

  if (iconOnly) {
    return (
      <div className={`${profilecenterCardStatus} flex justify-center`}>
        <Tooltip content={t('sider.cards.profilecenter')} placement="right">
          <Button
            size="sm"
            isIconOnly
            color={match ? 'primary' : 'default'}
            variant={match ? 'solid' : 'light'}
            onPress={() => navigate('/profile-center')}
          >
            <User className="text-[20px]" />
          </Button>
        </Tooltip>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 'calc(infinity)' : undefined
      }}
      className={`${profilecenterCardStatus} profile-center-card`}
    >
      <Card
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        fullWidth
        className={`${match ? 'bg-primary' : 'hover:bg-primary/30'} ${isDragging ? 'scale-[0.97] tap-highlight-transparent' : ''}`}
      >
        <CardBody className="pb-1 pt-0 px-0">
          <div className="flex justify-between">
            <Button
              isIconOnly
              className="bg-transparent pointer-events-none"
              variant="flat"
              color="default"
            >
              <User
                className={`${match ? 'text-primary-foreground' : 'text-foreground'} text-[24px] font-bold`}
              />
            </Button>
            <div className="flex flex-col justify-center pr-2">
              <div
                className={`text-sm font-bold ${match ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {t('sider.cards.profilecenter')}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default ProfileCenterCard