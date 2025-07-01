import { Button, Tooltip } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdPerson } from 'react-icons/md'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import MenuItem from './menu-item'
import React from 'react'

interface Props {
  iconOnly?: boolean
  menuStyle?: boolean
}

const ProfileCenterCard: React.FC<Props> = (props) => {
  const { iconOnly, menuStyle } = props
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.includes('/profile-center')
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

  if (menuStyle) {
    return (
      <div
        style={{
          position: 'relative',
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 'calc(infinity)' : undefined
        }}
        className="profile-center-card"
      >
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <MenuItem
            icon={<MdPerson />}
            title="个人中心"
            path="/profile-center"
            isActive={match}
          />
        </div>
      </div>
    )
  }

  if (iconOnly) {
    return (
      <div className="flex justify-center">
        <Tooltip content="个人中心" placement="right">
          <Button
            size="sm"
            isIconOnly
            color={match ? 'primary' : 'default'}
            variant={match ? 'solid' : 'light'}
            className={`enterprise-menu-item ${match ? 'active' : ''}`}
            onPress={() => {
              navigate('/profile-center')
            }}
          >
            <MdPerson className="text-[20px]" />
          </Button>
        </Tooltip>
      </div>
    )
  }

  return null
}

export default ProfileCenterCard 