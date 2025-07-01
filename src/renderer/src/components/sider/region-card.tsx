import { Button, Tooltip } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoEarth } from 'react-icons/io5'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MenuItem from './menu-item'
import React from 'react'

interface Props {
  iconOnly?: boolean
  menuStyle?: boolean
}

const RegionCard: React.FC<Props> = (props) => {
  const { iconOnly, menuStyle } = props
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.includes('/region')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'region'
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
        className="region-card"
      >
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <MenuItem
            icon={<IoEarth />}
            title="地区选择"
            path="/region"
            isActive={match}
          />
        </div>
      </div>
    )
  }

  if (iconOnly) {
    return (
      <div className="flex justify-center">
        <Tooltip content="地区选择" placement="right">
          <Button
            size="sm"
            isIconOnly
            color={match ? 'primary' : 'default'}
            variant={match ? 'solid' : 'light'}
            className={`enterprise-menu-item ${match ? 'active' : ''}`}
            onPress={() => {
              navigate('/region')
            }}
          >
            <IoEarth className="text-[20px]" />
          </Button>
        </Tooltip>
      </div>
    )
  }

  return null
}

export default RegionCard 