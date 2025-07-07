import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Crown } from 'lucide-react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useTranslation } from 'react-i18next'
import SidebarNavItem from '@renderer/components/sidebar/sidebar-nav-item'

interface Props {
  iconOnly?: boolean
}

const PackagePurchaseCard: React.FC<Props> = ({ iconOnly = false }) => {
  const { t } = useTranslation()
  const { appConfig } = useAppConfig()
  const { packagePurchaseCardStatus = 'col-span-1' } = appConfig || {}
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'packagepurchase'
  })
  
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null
  
  if (packagePurchaseCardStatus === 'hidden') {
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
      className={`${packagePurchaseCardStatus} package-purchase-card ${isDragging ? 'opacity-50' : ''}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <SidebarNavItem
        icon={<Crown className="w-5 h-5" />}
        label="购买套餐"
        path="/package-purchase"
        iconOnly={iconOnly}
        className={isDragging ? 'scale-[0.97]' : ''}
      />
    </div>
  )
}

export default PackagePurchaseCard