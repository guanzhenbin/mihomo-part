import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Receipt } from 'lucide-react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from 'react-i18next'
import SidebarNavItem from '@renderer/components/sidebar/sidebar-nav-item'

interface Props {
  iconOnly?: boolean
}

const OrderCenterCard: React.FC<Props> = ({ iconOnly = false }) => {
  const { t } = useTranslation()
  const { appConfig } = useAppConfig()
  const { orderCenterCardStatus = 'col-span-1' } = appConfig || {}
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'ordercenter'
  })
  
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null
  
  if (orderCenterCardStatus === 'hidden') {
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
      className={`${orderCenterCardStatus} order-center-card ${isDragging ? 'opacity-50' : ''}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <SidebarNavItem
        icon={<Receipt className="w-5 h-5" />}
        label="订单中心"
        path="/order-center"
        iconOnly={iconOnly}
        className={isDragging ? 'scale-[0.97]' : ''}
      />
    </div>
  )
}

export default OrderCenterCard