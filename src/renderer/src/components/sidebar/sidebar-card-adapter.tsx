import React from 'react'
import { useLocation } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SidebarNavItem from './sidebar-nav-item'
import { 
  Settings, 
  Wifi, 
  Users, 
  Globe, 
  Shield, 
  Database, 
  Edit, 
  Activity, 
  Cpu, 
  Network, 
  Search, 
  FileText, 
  Package 
} from 'lucide-react'

// 图标映射
const iconMap = {
  sysproxy: <Settings className="w-5 h-5" />,
  tun: <Wifi className="w-5 h-5" />,
  profile: <Users className="w-5 h-5" />,
  proxy: <Globe className="w-5 h-5" />,
  rule: <Shield className="w-5 h-5" />,
  resource: <Database className="w-5 h-5" />,
  override: <Edit className="w-5 h-5" />,
  connection: <Activity className="w-5 h-5" />,
  mihomo: <Cpu className="w-5 h-5" />,
  dns: <Network className="w-5 h-5" />,
  sniff: <Search className="w-5 h-5" />,
  log: <FileText className="w-5 h-5" />,
  substore: <Package className="w-5 h-5" />
}

// 路径映射
const pathMap = {
  sysproxy: '/sysproxy',
  tun: '/tun',
  profile: '/profiles',
  proxy: '/proxies',
  rule: '/rules',
  resource: '/resources',
  override: '/override',
  connection: '/connections',
  mihomo: '/mihomo',
  dns: '/dns',
  sniff: '/sniffer',
  log: '/logs',
  substore: '/substore'
}

// 标签映射
const labelMap = {
  sysproxy: '系统代理',
  tun: '虚拟网卡',
  profile: '订阅管理',
  proxy: '代理组',
  rule: '规则',
  resource: '外部资源',
  override: '覆写',
  connection: '连接',
  mihomo: '内核设置',
  dns: 'DNS',
  sniff: '域名嗅探',
  log: '日志',
  substore: 'Sub-Store'
}

interface SidebarCardAdapterProps {
  cardKey: string
  iconOnly?: boolean
}

const SidebarCardAdapter: React.FC<SidebarCardAdapterProps> = ({ cardKey, iconOnly = false }) => {
  const location = useLocation()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform: tf,
    transition,
    isDragging
  } = useSortable({
    id: cardKey
  })
  
  const transform = tf ? { x: tf.x, y: tf.y, scaleX: 1, scaleY: 1 } : null
  
  const icon = iconMap[cardKey as keyof typeof iconMap]
  const path = pathMap[cardKey as keyof typeof pathMap]
  const label = labelMap[cardKey as keyof typeof labelMap]
  
  if (!icon || !path || !label) {
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
      className={`${isDragging ? 'opacity-50' : ''}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <SidebarNavItem
        icon={icon}
        label={label}
        path={path}
        iconOnly={iconOnly}
        className={isDragging ? 'scale-[0.97]' : ''}
      />
    </div>
  )
}

export default SidebarCardAdapter