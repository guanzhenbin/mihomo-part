import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import OutboundModeSwitcher from '@renderer/components/sider/outbound-mode-switcher'
import SysproxySwitcher from '@renderer/components/sider/sysproxy-switcher'
import TunSwitcher from '@renderer/components/sider/tun-switcher'
import { Divider } from '@heroui/react'
import { IoSettings } from 'react-icons/io5'
import { MdNewReleases } from 'react-icons/md'
import routes from '@renderer/routes'
import UpdaterModal from '@renderer/components/updater/updater-modal'
import { checkUpdate } from '@renderer/utils/ipc'
import useSWR from 'swr'
import LoginPage from '@renderer/pages/login'
import LoadingPage from '@renderer/components/loading-page'
import { useAuth } from '@renderer/hooks/use-auth'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import ProfileCard from '@renderer/components/sider/profile-card'
import ProxyCard from '@renderer/components/sider/proxy-card'
import RuleCard from '@renderer/components/sider/rule-card'
import DNSCard from '@renderer/components/sider/dns-card'
import SniffCard from '@renderer/components/sider/sniff-card'
import OverrideCard from '@renderer/components/sider/override-card'
import ConnCard from '@renderer/components/sider/conn-card'
import LogCard from '@renderer/components/sider/log-card'
import MihomoCoreCard from '@renderer/components/sider/mihomo-core-card'
import ResourceCard from '@renderer/components/sider/resource-card'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { applyTheme, setNativeTheme, setTitleBarOverlay } from '@renderer/utils/ipc'
import { platform } from '@renderer/utils/init'
import { TitleBarOverlayOptions } from 'electron'
import SubStoreCard from '@renderer/components/sider/substore-card'
import ProfileCenterCard from '@renderer/components/sider/profile-center-card'
import DownloadCard from '@renderer/components/sider/download-card'
import SidebarSection from '@renderer/components/sidebar/sidebar-section'
import SidebarCardAdapter from '@renderer/components/sidebar/sidebar-card-adapter'
import MihomoIcon from './components/base/mihomo-icon'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useTranslation } from 'react-i18next'

let navigate: NavigateFunction
let driverInstance: ReturnType<typeof driver> | null = null

export function getDriver(): ReturnType<typeof driver> | null {
  return driverInstance
}

const App: React.FC = () => {
  const { t } = useTranslation()
  const { appConfig, patchAppConfig } = useAppConfig()
  const { isAuthenticated, isLoading } = useAuth()
  const [openUpdateModal, setOpenUpdateModal] = useState(false)
  const {
    appTheme = 'system',
    customTheme,
    useWindowFrame = false,
    siderWidth = 250,
    autoCheckUpdate = false,
    siderOrder = [
      'sysproxy',
      'tun',
      'profile',
      'proxy',
      'rule',
      'resource',
      'override',
      'download',
      'connection',
      'mihomo',
      'dns',
      'sniff',
      'log',
      'substore',
      'profilecenter'
    ]
  } = appConfig || {}
  const narrowWidth = platform === 'darwin' ? 70 : 60
  const [order, setOrder] = useState(siderOrder)
  const [siderWidthValue, setSiderWidthValue] = useState(siderWidth)
  const siderWidthValueRef = useRef(siderWidthValue)
  const [resizing, setResizing] = useState(false)
  const resizingRef = useRef(resizing)
  const sensors = useSensors(useSensor(PointerSensor))
  const { setTheme, systemTheme } = useTheme()
  navigate = useNavigate()
  const location = useLocation()
  const page = useRoutes(routes)
  
  // 检查更新
  const { data: latestUpdate } = useSWR(
    autoCheckUpdate ? 'checkUpdate' : undefined,
    autoCheckUpdate ? checkUpdate : (): undefined => {},
    {
      refreshInterval: 1000 * 60 * 10
    }
  )
  const setTitlebar = (): void => {
    if (!useWindowFrame && platform !== 'darwin') {
      const options = { height: 48 } as TitleBarOverlayOptions
      try {
        options.color = window.getComputedStyle(document.documentElement).backgroundColor
        options.symbolColor = window.getComputedStyle(document.documentElement).color
        setTitleBarOverlay(options)
      } catch (e) {
        // ignore
      }
    }
  }

  useEffect(() => {
    // 确保 download 在 siderOrder 中
    const updatedOrder = siderOrder.includes('download') 
      ? siderOrder 
      : [...siderOrder.slice(0, 7), 'download', ...siderOrder.slice(7)]
    
    // console.log('🎛️ Updated order with download:', updatedOrder)
    setOrder(updatedOrder)
    setSiderWidthValue(siderWidth)
    
    // 如果需要更新配置
    if (!siderOrder.includes('download')) {
      patchAppConfig({ siderOrder: updatedOrder })
    }
  }, [siderOrder, siderWidth, patchAppConfig])

  useEffect(() => {
    siderWidthValueRef.current = siderWidthValue
    resizingRef.current = resizing
  }, [siderWidthValue, resizing])

  useEffect(() => {
    driverInstance = driver({
      showProgress: true,
      nextBtnText: t('common.next'),
      prevBtnText: t('common.prev'),
      doneBtnText: t('common.done'),
      progressText: '{{current}} / {{total}}',
      overlayOpacity: 0.9,
      steps: [
        {
          element: 'none',
          popover: {
            title: t('guide.welcome.title'),
            description: t('guide.welcome.description'),
            side: 'over',
            align: 'center'
          }
        },
        {
          element: '.side',
          popover: {
            title: t('guide.sider.title'),
            description: t('guide.sider.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '.sysproxy-card',
          popover: {
            title: t('guide.card.title'),
            description: t('guide.card.description'),
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '.main',
          popover: {
            title: t('guide.main.title'),
            description: t('guide.main.description'),
            side: 'left',
            align: 'center'
          }
        },
        {
          element: '.profile-card',
          popover: {
            title: t('guide.profile.title'),
            description: t('guide.profile.description'),
            side: 'right',
            align: 'start',
            onNextClick: async (): Promise<void> => {
              navigate('/profiles')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: '.profiles-sticky',
          popover: {
            title: t('guide.import.title'),
            description: t('guide.import.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.substore-import',
          popover: {
            title: t('guide.substore.title'),
            description: t('guide.substore.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.new-profile',
          popover: {
            title: t('guide.localProfile.title'),
            description: t('guide.localProfile.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.sysproxy-card',
          popover: {
            title: t('guide.sysproxy.title'),
            description: t('guide.sysproxy.description'),
            side: 'right',
            align: 'start',
            onNextClick: async (): Promise<void> => {
              navigate('/sysproxy')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: '.sysproxy-settings',
          popover: {
            title: t('guide.sysproxySetting.title'),
            description: t('guide.sysproxySetting.description'),
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '.tun-card',
          popover: {
            title: t('guide.tun.title'),
            description: t('guide.tun.description'),
            side: 'right',
            align: 'start',
            onNextClick: async (): Promise<void> => {
              navigate('/tun')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: '.tun-settings',
          popover: {
            title: t('guide.tunSetting.title'),
            description: t('guide.tunSetting.description'),
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.override-card',
          popover: {
            title: t('guide.override.title'),
            description: t('guide.override.description'),
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '.dns-card',
          popover: {
            title: t('guide.dns.title'),
            description: t('guide.dns.description'),
            side: 'right',
            align: 'center',
            onNextClick: async (): Promise<void> => {
              navigate('/profiles')
              setTimeout(() => {
                driverInstance?.moveNext()
              }, 0)
            }
          }
        },
        {
          element: 'none',
          popover: {
            title: t('guide.end.title'),
            description: t('guide.end.description'),
            side: 'top',
            align: 'center',
            onNextClick: async (): Promise<void> => {
              navigate('/profiles')
              setTimeout(() => {
                driverInstance?.destroy()
              }, 0)
            }
          }
        }
      ]
    })

    const tourShown = window.localStorage.getItem('tourShown')
    if (!tourShown) {
      window.localStorage.setItem('tourShown', 'true')
      driverInstance.drive()
    }
  }, [t])

  useEffect(() => {
    setNativeTheme(appTheme)
    setTheme(appTheme)
    setTitlebar()
  }, [appTheme, systemTheme])

  useEffect(() => {
    applyTheme(customTheme || 'default.css').then(() => {
      setTitlebar()
    })
  }, [customTheme])

  useEffect(() => {
    window.addEventListener('mouseup', onResizeEnd)
    return (): void => window.removeEventListener('mouseup', onResizeEnd)
  }, [])

  const onResizeEnd = (): void => {
    if (resizingRef.current) {
      setResizing(false)
      patchAppConfig({ siderWidth: siderWidthValueRef.current })
    }
  }

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (over) {
      if (active.id !== over.id) {
        const newOrder = order.slice()
        const activeIndex = newOrder.indexOf(active.id as string)
        const overIndex = newOrder.indexOf(over.id as string)
        newOrder.splice(activeIndex, 1)
        newOrder.splice(overIndex, 0, active.id as string)
        setOrder(newOrder)
        await patchAppConfig({ siderOrder: newOrder })
        return
      }
    }
    navigate(navigateMap[active.id as string])
  }

  const navigateMap = {
    sysproxy: 'sysproxy',
    tun: 'tun',
    profile: 'profiles',
    proxy: 'proxies',
    mihomo: 'mihomo',
    connection: 'connections',
    dns: 'dns',
    sniff: 'sniffer',
    log: 'logs',
    rule: 'rules',
    resource: 'resources',
    override: 'override',
    substore: 'substore',
    profilecenter: 'profile-center',
    profileCenter: 'profile-center',
    download: 'download'
  }

  const componentMap = {
    sysproxy: SysproxySwitcher,
    tun: TunSwitcher,
    profile: ProfileCard,
    proxy: ProxyCard,
    mihomo: MihomoCoreCard,
    connection: ConnCard,
    dns: DNSCard,
    sniff: SniffCard,
    log: LogCard,
    rule: RuleCard,
    resource: ResourceCard,
    override: OverrideCard,
    substore: SubStoreCard,
    profilecenter: ProfileCenterCard,
    profileCenter: ProfileCenterCard,
    download: DownloadCard
  }

  // 调试当前的侧边栏配置
  // console.log('🎛️ Sidebar debug - siderOrder from config:', siderOrder)
  // console.log('🎛️ Sidebar debug - actual order:', order)
  // console.log('🎛️ Sidebar debug - componentMap keys:', Object.keys(componentMap))
  // console.log('🎛️ Sidebar debug - download in componentMap:', !!componentMap.download)
  // console.log('🎛️ Sidebar debug - appConfig:', appConfig)

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingPage />
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <>
      {/* 更新弹窗 */}
      {openUpdateModal && latestUpdate && (
        <UpdaterModal
          version={latestUpdate.version}
          changelog={latestUpdate.changelog}
          onClose={() => setOpenUpdateModal(false)}
        />
      )}
      
      <div
        onMouseMove={(e) => {
          if (!resizing) return
          if (e.clientX <= 150) {
            setSiderWidthValue(narrowWidth)
          } else if (e.clientX <= 250) {
            setSiderWidthValue(250)
          } else if (e.clientX >= 400) {
            setSiderWidthValue(400)
          } else {
            setSiderWidthValue(e.clientX)
          }
        }}
        className={`w-full h-[100vh] flex relative ${resizing ? 'cursor-ew-resize' : ''}`}
      >
      {siderWidthValue === narrowWidth ? (
        <div style={{ width: `${narrowWidth}px` }} className="side h-full flex flex-col">
          <div className="app-drag flex justify-center items-center z-40 bg-transparent h-[49px]">
            {platform !== 'darwin' && (
              <MihomoIcon className="h-[32px] leading-[32px] text-lg mx-[1px]" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="h-full w-full flex flex-col gap-2">
              {order.map((key: string) => {
                const Component = componentMap[key]
                if (!Component) return null
                return <Component key={key} iconOnly={true} />
              })}
            </div>
          </div>
          
          {/* 窄屏模式下的设置和更新按钮 - 左右布局 */}
          <div className="flex-shrink-0 px-3 py-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200/70 dark:border-gray-700/70">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/settings')}
                className={`flex-1 mr-2 p-3 rounded-2xl transition-all duration-300 app-nodrag group ${
                  location.pathname.includes('/settings')
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-xl shadow-primary/20'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center justify-center">
                  <IoSettings className={`text-lg transition-transform duration-300 ${
                    location.pathname.includes('/settings') ? '' : 'group-hover:rotate-90'
                  }`} />
                </div>
              </button>
              
              <div className="app-nodrag flex-shrink-0">
                <button 
                  onClick={() => setOpenUpdateModal(true)}
                  className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 text-red-500 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm transition-all duration-300"
                >
                  <MdNewReleases className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{ width: `${siderWidthValue}px` }}
          className="side h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30"
        >
          <div className="app-drag sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 h-[65px]">
            <div
              className={`flex items-center justify-between h-full px-5 ${!useWindowFrame && platform === 'darwin' ? 'ml-[60px]' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                  <MihomoIcon className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mihomo Party</h3>
                </div>
              </div>
              
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4">
            <div className="px-4 mb-6">
              <OutboundModeSwitcher />
            </div>
            
            <SidebarSection title="主要功能">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={onDragEnd}
              >
                <SortableContext items={order}>
                  {order.slice(0, 8).map((key: string) => {
                    // 特殊处理个人中心卡片
                    if (key === 'profileCenter' || key === 'profilecenter') {
                      return <ProfileCenterCard key={key} iconOnly={false} />
                    }
                    
                    // 特殊处理下载卡片
                    if (key === 'download') {
                      return <DownloadCard key={key} iconOnly={false} />
                    }
                    
                    // 使用适配器渲染其他卡片
                    return <SidebarCardAdapter key={key} cardKey={key} iconOnly={false} />
                  })}
                </SortableContext>
              </DndContext>
            </SidebarSection>

            <SidebarSection title="工具 & 设置">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={onDragEnd}
              >
                <SortableContext items={order}>
                  {order.slice(8).map((key: string) => {
                    // 特殊处理个人中心卡片
                    if (key === 'profileCenter' || key === 'profilecenter') {
                      return <ProfileCenterCard key={key} iconOnly={false} />
                    }
                    
                    // 特殊处理下载卡片
                    if (key === 'download') {
                      return <DownloadCard key={key} iconOnly={false} />
                    }
                    
                    // 使用适配器渲染其他卡片
                    return <SidebarCardAdapter key={key} cardKey={key} iconOnly={false} />
                  })}
                </SortableContext>
              </DndContext>
              
            </SidebarSection>
          </div>
          
          {/* 设置和更新按钮固定在侧边栏底部 - 左右布局 */}
          <div className="flex-shrink-0 px-4 py-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200/70 dark:border-gray-700/70">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigate('/settings')}
                className={`flex-1 px-4 py-3.5 rounded-2xl transition-all duration-300 app-nodrag group ${
                  location.pathname.includes('/settings')
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-xl shadow-primary/20'
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    location.pathname.includes('/settings')
                      ? 'bg-white/20'
                      : 'bg-gray-100/70 dark:bg-gray-700/70 group-hover:bg-gray-200/70 dark:group-hover:bg-gray-600/70'
                  }`}>
                    <IoSettings className={`w-4 h-4 transition-transform duration-300 ${
                      location.pathname.includes('/settings') ? '' : 'group-hover:rotate-90'
                    }`} />
                  </div>
                  <span className="font-semibold text-sm tracking-wide">
                    {t('common.settings')}
                  </span>
                </div>
              </button>
              
              <div className="app-nodrag flex-shrink-0">
                <div className="p-1 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                  <button 
                    onClick={() => setOpenUpdateModal(true)}
                    className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all duration-200"
                  >
                    {latestUpdate ? `v${latestUpdate.version}` : 'v1.7.6'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        onMouseDown={() => {
          setResizing(true)
        }}
        style={{
          position: 'fixed',
          zIndex: 50,
          left: `${siderWidthValue - 2}px`,
          width: '5px',
          height: '100vh',
          cursor: 'ew-resize'
        }}
        className={resizing ? 'bg-primary' : ''}
      />
      <Divider orientation="vertical" />
        <div
          style={{ width: `calc(100% - ${siderWidthValue + 1}px)` }}
          className="main grow h-full overflow-y-auto"
        >
          {page}
        </div>
      </div>
    </>
  )
}

export default App
