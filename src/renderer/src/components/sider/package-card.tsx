import { Button, Tooltip } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdCardMembership } from 'react-icons/md'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MenuItem from './menu-item'
import React from 'react'

interface Props {
  iconOnly?: boolean
  menuStyle?: boolean
}

const PackageCard: React.FC<Props> = (props) => {
  const { iconOnly, menuStyle } = props
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.includes('/package')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'package'
  })
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null

  if (menuStyle) {
    return (
      <div
        style={{
          position: 'relative',
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 'calc(infinity)' : undefined
        }}
        className="package-card"
      >
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
      <MenuItem
            icon={<MdCardMembership />}
        title="套餐管理"
        path="/package"
        isActive={match}
      />
        </div>
      </div>
    )
  }

  if (iconOnly) {
    return (
      <div className="flex justify-center">
        <Tooltip content="套餐管理" placement="right">
          <Button
            size="sm"
            isIconOnly
            color={match ? 'primary' : 'default'}
            variant={match ? 'solid' : 'light'}
            className={`enterprise-menu-item ${match ? 'active' : ''}`}
            onPress={() => {
              navigate('/package')
            }}
          >
            <MdCardMembership className="text-[20px]" />
          </Button>
        </Tooltip>
      </div>
    )
  }

  return null
}

export default PackageCard 