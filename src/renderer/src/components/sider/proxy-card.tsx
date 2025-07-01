import { Button, Card, CardBody, CardFooter, Tooltip } from '@heroui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LuGroup } from 'react-icons/lu'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGroups } from '@renderer/hooks/use-groups'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MenuItem from './menu-item'

interface Props {
  iconOnly?: boolean
  menuStyle?: boolean
}

const ProxyCard: React.FC<Props> = (props) => {
  const { t } = useTranslation()
  const { appConfig } = useAppConfig()
  const { iconOnly, menuStyle } = props
  const { proxyCardStatus = 'col-span-1' } = appConfig || {}
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.includes('/proxies')
  const { groups = [] } = useGroups()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: 'proxy'
  })
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null

  if (iconOnly) {
    return (
      <div className={`${proxyCardStatus} flex justify-center`}>
        <Tooltip content={t('proxies.card.title')} placement="right">
          <Button
            size="sm"
            isIconOnly
            color={match ? 'primary' : 'default'}
            variant={match ? 'solid' : 'light'}
            className={`enterprise-menu-item ${match ? 'active' : ''}`}
            onPress={() => {
              navigate('/proxies')
            }}
          >
            <LuGroup className="text-[20px]" />
          </Button>
        </Tooltip>
      </div>
    )
  }

  if (menuStyle) {
    return (
      <div
        style={{
          position: 'relative',
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 'calc(infinity)' : undefined
        }}
        className="proxy-card"
      >
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <MenuItem
            icon={<LuGroup />}
            title={t('proxies.card.title')}
            path="/proxies"
            count={groups.length}
          />
        </div>
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
      className={`${proxyCardStatus} proxy-card`}
    >
      <Card
        fullWidth
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`gaming-card data-flow ${match ? 'bg-primary active' : 'hover:bg-primary/30'} ${isDragging ? 'scale-[0.97] tap-highlight-transparent' : ''}`}
      >
        <CardBody className="pb-1 pt-0 px-0">
          <div className="flex justify-between">
            <Button
              isIconOnly
              className="bg-transparent pointer-events-none"
              variant="flat"
              color="default"
            >
              <LuGroup
                className="text-[24px] font-bold text-white"
              />
            </Button>
            <div className={`proxy-status-pill ${match ? 'connected' : ''} mr-2 mt-2`}>
              {groups.length}
            </div>
          </div>
        </CardBody>
        <CardFooter className="pt-1">
          <h3
            className="text-md font-bold text-white"
          >
            {t('proxies.card.title')}
          </h3>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ProxyCard
